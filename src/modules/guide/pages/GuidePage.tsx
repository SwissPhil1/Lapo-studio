import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import {
  Wallet,
  Ban,
  FileDown,
  CheckCircle,
  LayoutDashboard,
  MousePointerClick,
  Mail,
  Users,
  Calendar,
  GripVertical,
  UserPlus,
  Megaphone,
  Filter,
  ListTodo,
  BookOpen,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GuideWorkflow } from '../components/GuideWorkflow';
import { GuideStepCard } from '../components/GuideStepCard';

export default function GuidePage() {
  const { t } = useTranslation(['guide']);
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('guide:title')}</h1>
          <p className="text-sm text-muted-foreground">{t('guide:subtitle')}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">{t('guide:tabs.daily')}</TabsTrigger>
          <TabsTrigger value="weekly">{t('guide:tabs.weekly')}</TabsTrigger>
          <TabsTrigger value="asNeeded">{t('guide:tabs.asNeeded')}</TabsTrigger>
        </TabsList>

        {/* Daily Tasks */}
        <TabsContent value="daily" className="space-y-4 mt-4">
          <GuideWorkflow
            title={t('guide:reactivation.title')}
            icon={<ListTodo className="h-5 w-5" />}
            defaultOpen
          >
            <GuideStepCard
              stepNumber={1}
              icon={<LayoutDashboard className="h-4 w-4" />}
              action={t('guide:reactivation.step1')}
              tip={t('guide:reactivation.tip1')}
              linkTo="/crm/dashboard"
            />
            <GuideStepCard
              stepNumber={2}
              icon={<MousePointerClick className="h-4 w-4" />}
              action={t('guide:reactivation.step2')}
              tip={t('guide:reactivation.tip2')}
            />
            <GuideStepCard
              stepNumber={3}
              icon={<Mail className="h-4 w-4" />}
              action={t('guide:reactivation.step3')}
              tip={t('guide:reactivation.tip3')}
            />
            <GuideStepCard
              stepNumber={4}
              icon={<Users className="h-4 w-4" />}
              action={t('guide:reactivation.step4')}
              tip={t('guide:reactivation.tip4')}
              linkTo="/crm/patients"
            />
          </GuideWorkflow>

          <GuideWorkflow
            title={t('guide:appointments.title')}
            icon={<Calendar className="h-5 w-5" />}
          >
            <GuideStepCard
              stepNumber={1}
              icon={<LayoutDashboard className="h-4 w-4" />}
              action={t('guide:appointments.step1')}
              tip={t('guide:appointments.tip1')}
              linkTo="/crm/dashboard"
            />
          </GuideWorkflow>
        </TabsContent>

        {/* Weekly Tasks */}
        <TabsContent value="weekly" className="space-y-4 mt-4">
          {isAdmin ? (
            <GuideWorkflow
              title={t('guide:commissions.title')}
              icon={<Wallet className="h-5 w-5" />}
              defaultOpen
            >
              <GuideStepCard
                stepNumber={1}
                icon={<Wallet className="h-4 w-4" />}
                action={t('guide:commissions.step1')}
                tip={t('guide:commissions.tip1')}
                linkTo="/admin/commissions"
              />
              <GuideStepCard
                stepNumber={2}
                icon={<Ban className="h-4 w-4" />}
                action={t('guide:commissions.step2')}
                tip={t('guide:commissions.tip2')}
              />
              <GuideStepCard
                stepNumber={3}
                icon={<FileDown className="h-4 w-4" />}
                action={t('guide:commissions.step3')}
                tip={t('guide:commissions.tip3')}
                linkTo="/admin/payouts"
              />
              <GuideStepCard
                stepNumber={4}
                icon={<CheckCircle className="h-4 w-4" />}
                action={t('guide:commissions.step4')}
                tip={t('guide:commissions.tip4')}
              />
            </GuideWorkflow>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Wallet className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">
                {t('guide:tabs.weekly')} — Admin only
              </p>
            </div>
          )}
        </TabsContent>

        {/* As Needed */}
        <TabsContent value="asNeeded" className="space-y-4 mt-4">
          <GuideWorkflow
            title={t('guide:sendMessage.title')}
            icon={<Mail className="h-5 w-5" />}
          >
            <GuideStepCard
              stepNumber={1}
              icon={<Users className="h-4 w-4" />}
              action={t('guide:sendMessage.step1')}
              tip={t('guide:sendMessage.tip1')}
              linkTo="/crm/patients"
            />
            <GuideStepCard
              stepNumber={2}
              icon={<Mail className="h-4 w-4" />}
              action={t('guide:sendMessage.step2')}
              tip={t('guide:sendMessage.tip2')}
            />
            <GuideStepCard
              stepNumber={3}
              icon={<CheckCircle className="h-4 w-4" />}
              action={t('guide:sendMessage.step3')}
              tip={t('guide:sendMessage.tip3')}
            />
          </GuideWorkflow>

          <GuideWorkflow
            title={t('guide:pipeline.title')}
            icon={<GripVertical className="h-5 w-5" />}
          >
            <GuideStepCard
              stepNumber={1}
              icon={<LayoutDashboard className="h-4 w-4" />}
              action={t('guide:pipeline.step1')}
              tip={t('guide:pipeline.tip1')}
              linkTo="/crm/pipeline"
            />
            <GuideStepCard
              stepNumber={2}
              icon={<GripVertical className="h-4 w-4" />}
              action={t('guide:pipeline.step2')}
              tip={t('guide:pipeline.tip2')}
            />
          </GuideWorkflow>

          <GuideWorkflow
            title={t('guide:campaigns.title')}
            icon={<Megaphone className="h-5 w-5" />}
          >
            <GuideStepCard
              stepNumber={1}
              icon={<Filter className="h-4 w-4" />}
              action={t('guide:campaigns.step1')}
              tip={t('guide:campaigns.tip1')}
              linkTo="/crm/patients"
            />
            <GuideStepCard
              stepNumber={2}
              icon={<Megaphone className="h-4 w-4" />}
              action={t('guide:campaigns.step2')}
              tip={t('guide:campaigns.tip2')}
            />
            <GuideStepCard
              stepNumber={3}
              icon={<CheckCircle className="h-4 w-4" />}
              action={t('guide:campaigns.step3')}
              tip={t('guide:campaigns.tip3')}
            />
          </GuideWorkflow>

          <GuideWorkflow
            title={t('guide:assignTask.title')}
            icon={<UserPlus className="h-5 w-5" />}
          >
            <GuideStepCard
              stepNumber={1}
              icon={<LayoutDashboard className="h-4 w-4" />}
              action={t('guide:assignTask.step1')}
              tip={t('guide:assignTask.tip1')}
              linkTo="/crm/dashboard"
            />
            <GuideStepCard
              stepNumber={2}
              icon={<UserPlus className="h-4 w-4" />}
              action={t('guide:assignTask.step2')}
              tip={t('guide:assignTask.tip2')}
            />
          </GuideWorkflow>
        </TabsContent>
      </Tabs>
    </div>
  );
}
