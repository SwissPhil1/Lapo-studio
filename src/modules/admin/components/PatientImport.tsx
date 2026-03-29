import { useState } from "react";
import { useTranslation } from "react-i18next";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { supabase } from "@/shared/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportResult {
  total: number;
  added: number;
  skipped: number;
  errors: string[];
}

interface ClinicMindsRow {
  id?: string;
  prename?: string;
  name?: string;
  gender?: string;
  birthday?: string;
  email?: string;
  mobileAreaCode?: string;
  mobile?: string;
  langPref?: string;
  street?: string;
  number?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  firstBookingDate?: string;
  lastBookingDate?: string;
  [key: string]: string | undefined;
}

// Normalize phone number to international format - handles French (+33) and Swiss (+41)
const normalizePhone = (areaCode: string | undefined, mobile: string | undefined): string | null => {
  if (!mobile) return null;
  
  // Clean the mobile number
  let phone = mobile.replace(/[\s\-\(\)\.]/g, '');
  
  // If we have an area code, prepend it
  if (areaCode) {
    const cleanAreaCode = areaCode.replace(/[\s\-\(\)\.]/g, '');
    if (cleanAreaCode && !cleanAreaCode.startsWith('+')) {
      phone = `+${cleanAreaCode}${phone}`;
    } else if (cleanAreaCode) {
      phone = `${cleanAreaCode}${phone}`;
    }
  }
  
  // If already has +, we're done
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // For 10-digit local numbers starting with 0, determine country
  if (phone.startsWith('0') && phone.length === 10) {
    const prefix = phone.substring(0, 2);
    const prefix3 = phone.substring(0, 3);
    
    // French mobile prefixes: 06, 07 (except 076-079 which are Swiss)
    if (prefix === '06') {
      return `+33${phone.substring(1)}`;
    }
    if (prefix === '07') {
      // 076, 077, 078, 079 are Swiss mobile
      if (['076', '077', '078', '079'].includes(prefix3)) {
        return `+41${phone.substring(1)}`;
      }
      // 070-075 are French
      return `+33${phone.substring(1)}`;
    }
    
    // Default to Swiss for other prefixes
    return `+41${phone.substring(1)}`;
  }
  
  // Ensure it starts with +
  if (!phone.startsWith('+') && phone.length > 0) {
    phone = `+${phone}`;
  }
  
  return phone || null;
};

// Parse Excel file to array of rows
const parseExcelFile = (file: File): Promise<ClinicMindsRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json<ClinicMindsRow>(worksheet, { defval: '' });
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
};

// Parse CSV file to array of rows
const parseCsvFile = (file: File): Promise<ClinicMindsRow[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<ClinicMindsRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    });
  });
};

// Detect file type and parse accordingly
const parseFile = async (file: File): Promise<ClinicMindsRow[]> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'xlsx' || extension === 'xls') {
    return parseExcelFile(file);
  }
  return parseCsvFile(file);
};

export function PatientImport() {
  const { t } = useTranslation(["setup", "common"]);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<ClinicMindsRow[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      
      try {
        const rows = await parseFile(selectedFile);
        setPreview(rows.slice(0, 5));
      } catch (error) {
        toast.error(t("setup:importError", "Import error: {{error}}", { error: String(error) }));
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setIsImporting(true);
    setResult(null);
    
    try {
      const rows = await parseFile(file);
      const importResult: ImportResult = {
        total: rows.length,
        added: 0,
        skipped: 0,
        errors: []
      };
          
          // Process in batches of 50
          const batchSize = 50;
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            
            for (const row of batch) {
              try {
                const phone = normalizePhone(row.mobileAreaCode, row.mobile);
                const email = row.email?.trim().toLowerCase() || null;
                
                // Skip rows without email and phone
                if (!email && !phone) {
                  importResult.skipped++;
                  continue;
                }
                
                // Check if patient already exists by email or phone
                let existingPatient = null;
                
                if (email) {
                  const { data: byEmail } = await supabase
                    .from("patients")
                    .select("id")
                    .ilike("email", email)
                    .maybeSingle();
                  existingPatient = byEmail;
                }
                
                if (!existingPatient && phone) {
                  // Use normalized phone lookup
                  const { data: byPhone } = await supabase
                    .from("patients")
                    .select("id")
                    .eq("normalized_phone", phone.replace(/[\s\-\(\)\.]/g, '').replace(/^0/, '+41'))
                    .maybeSingle();
                  existingPatient = byPhone;
                }
                
                if (existingPatient) {
                  importResult.skipped++;
                  continue;
                }
                
                // Parse birthday
                let dateOfBirth: string | null = null;
                if (row.birthday) {
                  try {
                    const date = new Date(row.birthday);
                    if (!isNaN(date.getTime())) {
                      dateOfBirth = date.toISOString().split('T')[0];
                    }
                  } catch {
                    // Invalid date, skip
                  }
                }
                
                // Insert new patient
                const { error } = await supabase
                  .from("patients")
                  .insert({
                    first_name: row.prename?.trim() || null,
                    last_name: row.name?.trim() || null,
                    email: email,
                    phone: phone,
                    gender: row.gender?.trim() || null,
                    date_of_birth: dateOfBirth,
                  });
                
                if (error) {
                  if (error.code === "23505") {
                    // Duplicate, skip
                    importResult.skipped++;
                  } else {
                    importResult.errors.push(`${row.prename} ${row.name}: ${error.message}`);
                  }
                } else {
                  importResult.added++;
                }
              } catch (err) {
                importResult.errors.push(`${row.prename} ${row.name}: ${err}`);
              }
            }
      }
      
      setResult(importResult);
      
      if (importResult.added > 0) {
        toast.success(t("setup:importSuccess", "{{count}} patients imported successfully", { count: importResult.added }));
      } else if (importResult.skipped === importResult.total) {
        toast.info(t("setup:importAllSkipped", "All patients already exist in database"));
      }
    } catch (err) {
      toast.error(t("setup:importError", "Import error: {{error}}", { error: String(err) }));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          {t("setup:patientImport", "Patient Import")}
        </CardTitle>
        <CardDescription>
          {t("setup:patientImportDescription", "Import existing patients from ClinicMinds CSV export to prevent them from being counted as new referrals")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("setup:patientImportInfo", "Export your patient list from ClinicMinds. The system accepts Excel (.xlsx, .xls) or CSV files and automatically maps columns.")}
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <Label htmlFor="import-file">{t("setup:selectFile", "Select file (Excel or CSV)")}</Label>
          <Input
            id="import-file"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            disabled={isImporting}
          />
        </div>
        
        {preview.length > 0 && (
          <div className="space-y-2">
            <Label>{t("setup:preview", "Preview")} ({preview.length} {t("setup:rows", "rows")})</Label>
            <div className="overflow-x-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">{t("setup:firstName", "First Name")}</th>
                    <th className="px-3 py-2 text-left">{t("setup:lastName", "Last Name")}</th>
                    <th className="px-3 py-2 text-left">{t("common:email", "Email")}</th>
                    <th className="px-3 py-2 text-left">{t("common:phone", "Phone")}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">{row.prename}</td>
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2">{row.email}</td>
                      <td className="px-3 py-2">
                        {normalizePhone(row.mobileAreaCode, row.mobile) || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {result && (
          <Alert className={result.added > 0 ? "border-green-500" : "border-yellow-500"}>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>{t("setup:importResults", "Import Results")}:</strong></p>
                <ul className="list-disc list-inside text-sm">
                  <li>{t("setup:totalProcessed", "Total processed")}: {result.total}</li>
                  <li>{t("setup:added", "Added")}: {result.added}</li>
                  <li>{t("setup:skipped", "Skipped (already exist)")}: {result.skipped}</li>
                  {result.errors.length > 0 && (
                    <li className="text-destructive">{t("setup:errors", "Errors")}: {result.errors.length}</li>
                  )}
                </ul>
                {result.errors.length > 0 && result.errors.length <= 5 && (
                  <div className="mt-2 text-xs text-destructive">
                    {result.errors.map((err, idx) => (
                      <p key={idx}>{err}</p>
                    ))}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <Button
          onClick={handleImport}
          disabled={!file || isImporting}
          className="w-full"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("setup:importing", "Importing...")}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {t("setup:importPatients", "Import Patients")}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
