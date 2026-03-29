import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Prize, PrizeCategory } from '@/shared/types/prize'

const CATEGORIES: PrizeCategory[] = ['gift_card', 'experience', 'product', 'discount', 'other']

interface PrizeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prize: Prize | null
  onSave: (data: {
    name: string
    description: string | null
    lapo_cash_cost: number
    category: PrizeCategory
    image_url: string | null
    stock: number | null
    is_active: boolean
  }) => void
  saving: boolean
}

export function PrizeDialog({ open, onOpenChange, prize, onSave, saving }: PrizeDialogProps) {
  const { t } = useTranslation('prizes')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [cost, setCost] = useState('')
  const [category, setCategory] = useState<PrizeCategory>('gift_card')
  const [stock, setStock] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (prize) {
      setName(prize.name)
      setDescription(prize.description ?? '')
      setCost(String(prize.lapo_cash_cost))
      setCategory(prize.category)
      setStock(prize.stock !== null ? String(prize.stock) : '')
      setImageUrl(prize.image_url ?? '')
      setIsActive(prize.is_active)
    } else {
      setName('')
      setDescription('')
      setCost('')
      setCategory('gift_card')
      setStock('')
      setImageUrl('')
      setIsActive(true)
    }
  }, [prize, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numCost = parseFloat(cost)
    if (isNaN(numCost) || numCost <= 0) return

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      lapo_cash_cost: numCost,
      category,
      image_url: imageUrl.trim() || null,
      stock: stock ? parseInt(stock, 10) : null,
      is_active: isActive,
    })
  }

  const isEditing = !!prize

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('dialog.editTitle') : t('dialog.createTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prize-name">{t('dialog.nameLabel')}</Label>
            <Input
              id="prize-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('dialog.namePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prize-desc">{t('dialog.descriptionLabel')}</Label>
            <Textarea
              id="prize-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('dialog.descriptionPlaceholder')}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prize-cost">{t('dialog.costLabel')}</Label>
              <Input
                id="prize-cost"
                type="number"
                min="0"
                step="1"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prize-category">{t('dialog.categoryLabel')}</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as PrizeCategory)}>
                <SelectTrigger id="prize-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(`categories.${cat}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prize-stock">{t('dialog.stockLabel')}</Label>
              <Input
                id="prize-stock"
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder={t('dialog.stockPlaceholder')}
              />
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                {t('dialog.activeLabel')}
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prize-image">{t('dialog.imageLabel')}</Label>
            <Input
              id="prize-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder={t('dialog.imagePlaceholder')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('dialog.createTitle', { context: 'cancel' })}
            </Button>
            <Button type="submit" disabled={saving || !name.trim() || !cost}>
              {saving ? '...' : isEditing ? t('dialog.save') : t('dialog.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
