import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, Edit, Trash2, Pause, Play } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency, formatDate, formatLapoCash } from "@/shared/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/modules/admin/components/StatusBadge";
import { DataTable, type Column } from "@/modules/admin/components/DataTable";
import { toast } from "sonner";
import { ReferrerActivityDot } from "@/modules/admin/components/ReferrerActivityDot";
import { PayoutProfileIndicator } from "@/modules/admin/components/PayoutProfileIndicator";
import { usePayoutProfileStatus } from "@/shared/hooks/usePayoutProfileStatus";
import { formatDate as formatDateSimple } from "date-fns";
import { getTierBadgeStyles } from "@/shared/lib/referrerTierBadge";
import { LapoCashReferrerCard } from "@/modules/admin/components/LapoCashReferrerCard";
import { useLapoCashWallet, useLapoCashTransactions } from "@/shared/hooks/useLapoCashWallet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReferrerData {
  id: string;
  referrer_code: string;
  email: string;
  phone_number: string | null;
  referrer_type_id: string;
  referrer_type_code: string | null;
  referrer_type_name: string | null;
  status: string;
  created_at: string;
  company_id: string | null;
  patient_id: string | null;
  patient_name: string | null;
  patient_first_name: string | null;
  patient_last_name: string | null;
  iban: string | null;
  bank_name: string | null;
  bank_address: string | null;
  address: string | null;
  company_name: string | null;
  total_referrals: number;
  booked_referrals: number;
  confirmed_referrals: number;
  total_commissions: number;
  pending_commissions: number;
  last_referral_at: string | null;
  auto_payout_enabled: boolean;
  auto_payout_paused_at: string | null;
}

interface ReferralRow {
  id: string;
  created_at: string;
  referral_status: string;
  booking_id: string | null;
  referred_name: string | null;
  referred_email: string | null;
  booking_value: number | null;
  commission_earned: number | null;
}

interface ReferrerType {
  id: string;
  name: string;
  code: string;
  first_purchase_rate: number;
  repeat_purchase_rate: number;
  is_active: boolean;
}

interface LapoCashTx {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

// Transactions Tabs Component
function TransactionsTabs({
  referrerId,
  referrals,
  referralsLoading,
  referralColumns,
  onReferralClick,
}: {
  referrerId: string;
  referrals: ReferralRow[];
  referralsLoading: boolean;
  referralColumns: Column<ReferralRow>[];
  onReferralClick: (row: ReferralRow) => void;
}) {
  const { data: wallet } = useLapoCashWallet(referrerId);
  const { data: lapoCashTransactions, isLoading: lapoCashLoading } = useLapoCashTransactions(wallet?.id);

  const lapoCashColumns: Column<LapoCashTx>[] = [
    {
      key: "date",
      header: "Date",
      cell: (row) => <span className="text-sm text-foreground">{formatDate(row.created_at)}</span>,
    },
    {
      key: "type",
      header: "Type",
      cell: (row) => (
        <span className="text-sm font-medium text-amber-700 capitalize">
          {row.type.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (row) => <span className="text-sm text-muted-foreground">{row.description || "—"}</span>,
    },
    {
      key: "amount",
      header: "Montant",
      cell: (row) => (
        <span className={`text-sm font-medium ${row.amount >= 0 ? "text-success" : "text-destructive"}`}>
          {row.amount >= 0 ? "+" : ""}{formatLapoCash(row.amount)}
        </span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="referrals" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="referrals">Parrainages ({referrals.length})</TabsTrigger>
            <TabsTrigger value="lapo-cash">LAPO Cash ({lapoCashTransactions?.length || 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="referrals">
            <DataTable
              data={referrals}
              columns={referralColumns}
              loading={referralsLoading}
              onRowClick={onReferralClick}
            />
          </TabsContent>
          <TabsContent value="lapo-cash">
            <DataTable
              data={(lapoCashTransactions as LapoCashTx[]) || []}
              columns={lapoCashColumns}
              loading={lapoCashLoading}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function ReferrerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteReferrer = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await fetch(
        `https://dcrlaoudqcfbauxalbgs.supabase.co/functions/v1/delete-referrer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ referrer_id: id }),
        }
      );

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      toast.success(`Référent supprimé (${result.deleted.referrals_deleted} parrainages, ${result.deleted.commissions_deleted} commissions)`);
      navigate("/admin/referrers");
    } catch (error) {
      console.error("Error deleting referrer:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    iban: "",
    bank_name: "",
    bank_address: "",
    address: "",
  });

  // Fetch payout profile status
  const { data: payoutStatus } = usePayoutProfileStatus(id);

  // Fetch last reminder
  const { data: lastReminder } = useQuery({
    queryKey: ["last-payout-reminder", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrer_notifications")
        .select("created_at")
        .eq("referrer_id", id!)
        .eq("type", "payout_profile_reminder")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch available referrer types
  const { data: referrerTypes } = useQuery({
    queryKey: ["referrer-types-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrer_types")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as ReferrerType[];
    },
  });

  const { data: referrer, isLoading } = useQuery({
    queryKey: ["referrer-detail", id],
    queryFn: async () => {
      // Get referrer basic info with type (avoid patient join due to RLS)
      const { data: referrerData, error: referrerError } = await supabase
        .from("referrers")
        .select(
          `
          id,
          referrer_code,
          email,
          phone_number,
          referrer_type_id,
          status,
          created_at,
          company_id,
          patient_id,
          iban,
          bank_name,
          bank_address,
          address,
          auto_payout_enabled,
          auto_payout_paused_at,
          companies(name),
          referrer_types!referrers_referrer_type_id_fkey(code, name, first_purchase_rate, repeat_purchase_rate)
        `
        )
        .eq("id", id!)
        .single();

      if (referrerError) throw referrerError;

      // Fetch patient data separately to avoid RLS join issues
      let patientName = null;
      let patientFirstName = null;
      let patientLastName = null;
      let patientPhone = null;
      if (referrerData.patient_id) {
        const { data: patientData } = await supabase
          .from("patients")
          .select("first_name, last_name, phone")
          .eq("id", referrerData.patient_id)
          .single();
        
        if (patientData) {
          patientName = `${patientData.first_name} ${patientData.last_name}`;
          patientFirstName = patientData.first_name;
          patientLastName = patientData.last_name;
          patientPhone = patientData.phone;
        }
      }

      // Get referrer summary stats
      const { data: summaryData } = await supabase
        .from("referrer_summary")
        .select("*")
        .eq("referrer_id", id!)
        .single();

      const referrerWithData = {
        id: referrerData.id,
        referrer_code: referrerData.referrer_code,
        email: referrerData.email,
        phone_number: patientPhone || referrerData.phone_number,
        referrer_type_id: referrerData.referrer_type_id,
        referrer_type_code: (referrerData.referrer_types as any)?.code || null,
        referrer_type_name: (referrerData.referrer_types as any)?.name || null,
        status: referrerData.status,
        created_at: referrerData.created_at,
        company_id: referrerData.company_id,
        patient_id: referrerData.patient_id,
        patient_name: patientName,
        patient_first_name: patientFirstName,
        patient_last_name: patientLastName,
        iban: referrerData.iban,
        bank_name: referrerData.bank_name,
        bank_address: referrerData.bank_address,
        address: referrerData.address,
        company_name: (referrerData.companies as any)?.name || null,
        total_referrals: summaryData?.total_referrals || 0,
        booked_referrals: summaryData?.booked_referrals || 0,
        confirmed_referrals: summaryData?.confirmed_referrals || 0,
        total_commissions: summaryData?.total_commissions || 0,
        pending_commissions: summaryData?.total_commissions_pending || 0,
        last_referral_at: summaryData?.latest_referral_at || null,
        auto_payout_enabled: referrerData.auto_payout_enabled !== false, // default true
        auto_payout_paused_at: referrerData.auto_payout_paused_at,
      };

      // Initialize edit form with fetched data
      setEditForm({
        first_name: patientFirstName || "",
        last_name: patientLastName || "",
        email: referrerData.email || "",
        phone_number: patientPhone || referrerData.phone_number || "",
        iban: referrerData.iban || "",
        bank_name: referrerData.bank_name || "",
        bank_address: referrerData.bank_address || "",
        address: referrerData.address || "",
      });

      return referrerWithData as ReferrerData;
    },
    enabled: !!id,
  });

  // Toggle auto-payout mutation
  const toggleAutoPayoutMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const updates: { auto_payout_enabled: boolean; auto_payout_paused_at?: string | null } = {
        auto_payout_enabled: enabled,
      };
      
      if (!enabled) {
        updates.auto_payout_paused_at = new Date().toISOString();
      } else {
        updates.auto_payout_paused_at = null;
      }

      const { error } = await supabase
        .from("referrers")
        .update(updates)
        .eq("id", id!);

      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["referrer-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["referrers-performance"] });
      toast.success(enabled 
        ? "Versements automatiques activés" 
        : "Versements automatiques suspendus"
      );
    },
    onError: () => {
      toast.error("Échec de la mise à jour");
    },
  });

  // Update referrer type mutation
  const updateTypeMutation = useMutation({
    mutationFn: async (newTypeId: string) => {
      const { error } = await supabase
        .from("referrers")
        .update({ referrer_type_id: newTypeId })
        .eq("id", id!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrer-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["referrers-performance"] });
      setTypeDialogOpen(false);
      toast.success("Referrer type updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update referrer type: ${error.message}`);
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      // Update referrer fields
      const { error: referrerError } = await supabase
        .from("referrers")
        .update({
          email: editForm.email,
          phone_number: editForm.phone_number || null,
          iban: editForm.iban || null,
          bank_name: editForm.bank_name || null,
          bank_address: editForm.bank_address || null,
          address: editForm.address || null,
        })
        .eq("id", id!);

      if (referrerError) throw referrerError;

      // Update patient fields if patient exists
      if (referrer?.patient_id) {
        const { error: patientError } = await supabase
          .from("patients")
          .update({
            first_name: editForm.first_name,
            last_name: editForm.last_name,
            email: editForm.email,
            phone: editForm.phone_number || null,
          })
          .eq("id", referrer.patient_id);

        if (patientError) throw patientError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrer-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["referrers-performance"] });
      queryClient.invalidateQueries({ queryKey: ["payout-profile-status", id] });
      setEditDialogOpen(false);
      toast.success("Profile updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery({
    queryKey: ["referrer-referrals", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select(
          `
          id,
          created_at,
          referral_status,
          booking_id,
          referred_patient_id,
          referred_profile_id
        `
        )
        .eq("referrer_id", id!)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get commission data for this referrer - aggregate by patient, not booking
      const { data: commissions } = await supabase
        .from("commission_entries")
        .select("patient_id, commission_amount, purchase_amount")
        .eq("referrer_id", id!)
        .eq("is_test", false)
        .not("status", "in", "(cancelled,reversed)");

      // Create maps aggregating by patient_id (to capture all commissions for a referred person)
      const commissionMap = new Map<string, number>();
      const purchaseMap = new Map<string, number>();
      
      (commissions || []).forEach((c) => {
        if (c.patient_id) {
          const existingCommission = commissionMap.get(c.patient_id) || 0;
          commissionMap.set(c.patient_id, existingCommission + (c.commission_amount || 0));
          
          const existingPurchase = purchaseMap.get(c.patient_id) || 0;
          purchaseMap.set(c.patient_id, existingPurchase + (c.purchase_amount || 0));
        }
      });

      // Get referred person details and booking values
      const enriched = await Promise.all(
        data.map(async (r) => {
          let referred_name = null;
          let referred_email = null;

          // Try to get patient info first
          if (r.referred_patient_id) {
            const { data: patient } = await supabase
              .from("patients")
              .select("first_name, last_name, email")
              .eq("id", r.referred_patient_id)
              .single();

            if (patient) {
              referred_name = `${patient.first_name} ${patient.last_name}`;
              referred_email = patient.email;
            }
          }

          // Fallback to profile
          if (!referred_name && r.referred_profile_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("first_name, last_name, email")
              .eq("id", r.referred_profile_id)
              .single();

            if (profile) {
              referred_name = `${profile.first_name} ${profile.last_name}`;
              referred_email = profile.email;
            }
          }

          // Get purchase amount and commission from our maps using patient_id
          const patient_id = r.referred_patient_id || r.referred_profile_id;
          const booking_value = patient_id ? purchaseMap.get(patient_id) || null : null;
          const commission_earned = patient_id ? commissionMap.get(patient_id) || null : null;

          return {
            id: r.id,
            created_at: r.created_at,
            referral_status: r.referral_status,
            booking_id: r.booking_id,
            referred_name,
            referred_email,
            booking_value,
            commission_earned,
          };
        })
      );

      return enriched as ReferralRow[];
    },
    enabled: !!id,
  });

  const referralColumns: Column<ReferralRow>[] = [
    {
      key: "date",
      header: "Date",
      cell: (row) => (
        <span className="text-sm text-foreground">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: "referred",
      header: "Personne parrainée",
      cell: (row) => (
        <div>
          <div className="text-sm text-foreground">{row.referred_name || "—"}</div>
          <div className="text-xs text-muted-foreground">{row.referred_email || "—"}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => <StatusBadge status={row.referral_status} type="referral" />,
    },
    {
      key: "amount_spent",
      header: "Montant dépensé",
      cell: (row) => (
        <span className="text-sm text-foreground">
          {row.booking_value ? formatCurrency(row.booking_value) : "—"}
        </span>
      ),
    },
    {
      key: "commission_earned",
      header: "Commission gagnée",
      cell: (row) => (
        <span className="text-sm font-medium text-foreground">
          {row.commission_earned ? formatCurrency(row.commission_earned) : "—"}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!referrer) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Referrer Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The referrer you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/admin/referrers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Referrers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/referrers")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Referrers
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Referrer Details</h1>
              <div className="mt-2 text-sm text-muted-foreground font-mono">
                {referrer.referrer_code}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditForm({
                    first_name: referrer.patient_first_name || "",
                    last_name: referrer.patient_last_name || "",
                    email: referrer.email || "",
                    phone_number: referrer.phone_number || "",
                    iban: referrer.iban || "",
                    bank_name: referrer.bank_name || "",
                    bank_address: referrer.bank_address || "",
                    address: referrer.address || "",
                  });
                  setEditDialogOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
              
              {/* Delete Confirmation Dialog */}
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce référent ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera définitivement ce référent ainsi que tous ses parrainages, réservations et commissions associés. Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteReferrer}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Suppression..." : "Supprimer"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        {(() => {
                          const tierStyles = getTierBadgeStyles(referrer.referrer_type_code, referrer.referrer_type_name);
                          return (
                            <button className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium hover:opacity-80 transition-opacity cursor-pointer ${tierStyles.className}`}>
                              {tierStyles.label}
                            </button>
                          );
                        })()}
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm">
                        {referrer.referrer_type_name || "Standard"} · {referrerTypes?.find(t => t.id === referrer.referrer_type_id)?.first_purchase_rate || 0}% première visite · {referrerTypes?.find(t => t.id === referrer.referrer_type_id)?.repeat_purchase_rate || 0}% visites suivantes
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Referrer Type</DialogTitle>
                    <DialogDescription>
                      Détermine les règles de commission pour ce référent.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="type-select">Referrer Type</Label>
                      <Select
                        value={referrer.referrer_type_id}
                        onValueChange={(value) => updateTypeMutation.mutate(value)}
                      >
                        <SelectTrigger id="type-select">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {referrerTypes?.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.code} ({type.first_purchase_rate}/{type.repeat_purchase_rate})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTypeDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => setTypeDialogOpen(false)} 
                      disabled={updateTypeMutation.isPending}
                    >
                      {updateTypeMutation.isPending ? "Saving..." : "Done"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <ReferrerActivityDot
                lastReferralAt={referrer.last_referral_at}
                createdAt={referrer.created_at}
              />
            </div>
          </div>
        </div>

        {/* Profil du référent */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Profil du référent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Nom complet</span>
                <p className="font-medium text-foreground">
                  {referrer.patient_name || "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Email</span>
                <p className="font-medium">
                  <a 
                    href={`mailto:${referrer.email}`} 
                    className="text-primary hover:underline"
                  >
                    {referrer.email}
                  </a>
                </p>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Téléphone</span>
                <p className="font-medium text-foreground">
                  {referrer.phone_number || "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Entreprise</span>
                <p className="font-medium text-foreground">
                  {referrer.company_name || "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Créé le</span>
                <p className="font-medium text-foreground">
                  {formatDate(referrer.created_at)}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground block mb-1">Informations bancaires</span>
                <div className="flex items-center gap-3">
                  <PayoutProfileIndicator referrerId={referrer.id} size="md" />
                  {payoutStatus && !payoutStatus.isComplete && (
                    <Button
                      variant="outline"
                      size="sm"
                      title="Le référent doit compléter ses informations bancaires (iban, banque…)"
                      onClick={async () => {
                        setSendingReminder(true);
                        try {
                          const { error } = await supabase.rpc("send_payout_profile_reminder", {
                            p_referrer_id: referrer.id,
                          });

                          if (error) {
                            if (error.message.includes("7 days")) {
                              toast.error("Un rappel a déjà été envoyé au cours des 7 derniers jours");
                            } else if (error.message.includes("already complete")) {
                              toast.info("Informations bancaires déjà complètes");
                            } else {
                              toast.error("Échec de l'envoi du rappel");
                            }
                          } else {
                            toast.success("Rappel envoyé au référent (app + email)");
                            queryClient.invalidateQueries({ queryKey: ["last-payout-reminder", id] });
                          }
                        } finally {
                          setSendingReminder(false);
                        }
                      }}
                      disabled={sendingReminder}
                    >
                      {sendingReminder ? "Envoi..." : "Envoyer un rappel d'informations de paiement"}
                    </Button>
                  )}
                </div>
                {lastReminder && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Dernier rappel: {formatDateSimple(new Date(lastReminder.created_at), "dd.MM.yyyy")}
                  </p>
                )}
              </div>
              
              {/* Auto-payout status */}
              <div className="col-span-2">
                <span className="text-muted-foreground block mb-1">Versements automatiques</span>
                <div className="flex items-center gap-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                          referrer.auto_payout_enabled 
                            ? "bg-success-bg text-success border border-success/20" 
                            : "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                        }`}>
                          {referrer.auto_payout_enabled ? (
                            <>
                              <Play className="h-3.5 w-3.5" />
                              Actif
                            </>
                          ) : (
                            <>
                              <Pause className="h-3.5 w-3.5" />
                              Suspendu
                            </>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">
                          {referrer.auto_payout_enabled 
                            ? "Les commissions seront versées automatiquement" 
                            : "Les commissions sont conservées pour conversion en LAPO Cash"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAutoPayoutMutation.mutate(!referrer.auto_payout_enabled)}
                    disabled={toggleAutoPayoutMutation.isPending}
                    className="text-xs"
                  >
                    {toggleAutoPayoutMutation.isPending 
                      ? "..." 
                      : referrer.auto_payout_enabled 
                        ? "Suspendre" 
                        : "Activer"}
                  </Button>
                  {!referrer.auto_payout_enabled && referrer.auto_payout_paused_at && (
                    <span className="text-xs text-muted-foreground">
                      Suspendu depuis {formatDateSimple(new Date(referrer.auto_payout_paused_at), "dd.MM.yyyy")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LAPO Cash Section */}
        <div className="mb-8">
          <LapoCashReferrerCard
            referrerId={referrer.id}
            referrerName={referrer.patient_name || referrer.email}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {referrer.total_referrals}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Booked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {referrer.booked_referrals}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Confirmed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {referrer.confirmed_referrals}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Commissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(referrer.total_commissions)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending: {formatCurrency(referrer.pending_commissions)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Tabs - Commissions & LAPO Cash */}
        <TransactionsTabs 
          referrerId={referrer.id}
          referrals={referrals || []}
          referralsLoading={referralsLoading}
          referralColumns={referralColumns}
          onReferralClick={(row) => navigate(`/admin/referrals/${row.id}`)}
        />

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Referrer Profile</DialogTitle>
            <DialogDescription>
              Modifier les informations du référent. Les modifications seront synchronisées partout.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-first-name">Prénom</Label>
                  <Input
                    id="edit-first-name"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-last-name">Nom</Label>
                  <Input
                    id="edit-last-name"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Téléphone</Label>
                  <Input
                    id="edit-phone"
                    value={editForm.phone_number}
                    onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Bank Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Bank Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-iban">IBAN</Label>
                  <Input
                    id="edit-iban"
                    value={editForm.iban}
                    onChange={(e) => setEditForm({ ...editForm, iban: e.target.value })}
                    placeholder="CH93 0000 0000 0000 0000 0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-bank-name">Nom de la banque</Label>
                  <Input
                    id="edit-bank-name"
                    value={editForm.bank_name}
                    onChange={(e) => setEditForm({ ...editForm, bank_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-bank-address">Adresse de la banque</Label>
                  <Input
                    id="edit-bank-address"
                    value={editForm.bank_address}
                    onChange={(e) => setEditForm({ ...editForm, bank_address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Adresse du référent</Label>
                  <Input
                    id="edit-address"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => updateProfileMutation.mutate()} 
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
