import { useTranslation } from 'react-i18next'

export default function PipelinePage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t('nav.pipeline')}</h1>
      <div className="rounded-xl border border-studio-border bg-studio-card p-6">
        <p className="text-studio-muted">
          Pipeline Kanban board — migrating from harmony-hub. Will use @dnd-kit for drag-and-drop.
        </p>
      </div>
    </div>
  )
}
