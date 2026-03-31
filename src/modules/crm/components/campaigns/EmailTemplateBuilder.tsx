import { useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/shared/lib/utils';
import {
  Type,
  Image,
  MousePointerClick,
  Minus,
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  Eye,
  Code,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Block types
// ---------------------------------------------------------------------------

type BlockType = 'heading' | 'text' | 'image' | 'button' | 'divider' | 'spacer';

interface TemplateBlock {
  id: string;
  type: BlockType;
  content: string;
  props: Record<string, string>;
}

interface EmailTemplateBuilderProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Utility: parse simple HTML to blocks & serialize back
// ---------------------------------------------------------------------------

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function blocksToHtml(blocks: TemplateBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'heading':
          return `<h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a1a;">${block.content}</h2>`;
        case 'text':
          return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">${block.content}</p>`;
        case 'image':
          return `<img src="${block.props.src || ''}" alt="${block.props.alt || ''}" style="max-width:100%;height:auto;border-radius:8px;margin:0 0 16px;" />`;
        case 'button':
          return `<table cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr><td style="background:${block.props.color || '#7C3AED'};border-radius:6px;padding:12px 28px;"><a href="${block.props.href || '#'}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${block.content}</a></td></tr></table>`;
        case 'divider':
          return '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />';
        case 'spacer':
          return `<div style="height:${block.props.height || '24'}px;"></div>`;
        default:
          return '';
      }
    })
    .join('\n');
}

function createBlock(type: BlockType): TemplateBlock {
  const base = { id: generateId(), type, content: '', props: {} };
  switch (type) {
    case 'heading':
      return { ...base, content: 'Your heading here' };
    case 'text':
      return { ...base, content: 'Write your message content here...' };
    case 'image':
      return { ...base, props: { src: '', alt: 'Image' } };
    case 'button':
      return { ...base, content: 'Click here', props: { href: '#', color: '#7C3AED' } };
    case 'divider':
      return base;
    case 'spacer':
      return { ...base, props: { height: '24' } };
    default:
      return base;
  }
}

// ---------------------------------------------------------------------------
// Block palette items
// ---------------------------------------------------------------------------

const BLOCK_TYPES: { type: BlockType; icon: typeof Type; label: string }[] = [
  { type: 'heading', icon: Type, label: 'Heading' },
  { type: 'text', icon: Type, label: 'Text' },
  { type: 'image', icon: Image, label: 'Image' },
  { type: 'button', icon: MousePointerClick, label: 'Button' },
  { type: 'divider', icon: Minus, label: 'Divider' },
];

// ---------------------------------------------------------------------------
// Block Editor (inline editing for each block)
// ---------------------------------------------------------------------------

function BlockEditor({
  block,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  block: TemplateBlock;
  onUpdate: (block: TemplateBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { t } = useTranslation(['campaigns']);

  return (
    <div className="group relative flex gap-2 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30">
      {/* Drag handle & reorder */}
      <div className="flex flex-col items-center gap-0.5 shrink-0 pt-1">
        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
          aria-label="Move up"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
          aria-label="Move down"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Block content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {block.type}
          </span>
        </div>

        {block.type === 'heading' && (
          <Input
            value={block.content}
            onChange={(e) => onUpdate({ ...block, content: e.target.value })}
            placeholder={t('campaigns:builder.headingPlaceholder', { defaultValue: 'Heading text...' })}
            className="text-sm font-semibold"
          />
        )}

        {block.type === 'text' && (
          <Textarea
            value={block.content}
            onChange={(e) => onUpdate({ ...block, content: e.target.value })}
            placeholder={t('campaigns:builder.textPlaceholder', { defaultValue: 'Body text...' })}
            rows={3}
            className="text-sm resize-none"
          />
        )}

        {block.type === 'image' && (
          <div className="space-y-2">
            <Input
              value={block.props.src || ''}
              onChange={(e) => onUpdate({ ...block, props: { ...block.props, src: e.target.value } })}
              placeholder={t('campaigns:builder.imageUrlPlaceholder', { defaultValue: 'Image URL...' })}
              className="text-sm"
            />
            <Input
              value={block.props.alt || ''}
              onChange={(e) => onUpdate({ ...block, props: { ...block.props, alt: e.target.value } })}
              placeholder={t('campaigns:builder.imageAltPlaceholder', { defaultValue: 'Alt text...' })}
              className="text-sm"
            />
          </div>
        )}

        {block.type === 'button' && (
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={block.content}
              onChange={(e) => onUpdate({ ...block, content: e.target.value })}
              placeholder={t('campaigns:builder.buttonLabel', { defaultValue: 'Button label' })}
              className="text-sm"
            />
            <Input
              value={block.props.href || ''}
              onChange={(e) => onUpdate({ ...block, props: { ...block.props, href: e.target.value } })}
              placeholder={t('campaigns:builder.buttonUrl', { defaultValue: 'https://...' })}
              className="text-sm"
            />
          </div>
        )}

        {block.type === 'divider' && (
          <div className="border-t border-border my-1" />
        )}
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="shrink-0 p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Delete block"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview Panel
// ---------------------------------------------------------------------------

function EmailPreview({ blocks }: { blocks: TemplateBlock[] }) {
  const html = blocksToHtml(blocks);
  return (
    <div className="rounded-lg border border-border bg-white p-6 text-left">
      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function EmailTemplateBuilder({ value, onChange, className }: EmailTemplateBuilderProps) {
  const { t } = useTranslation(['campaigns']);
  const [blocks, setBlocks] = useState<TemplateBlock[]>(() => {
    // If there's existing content, create a single text block with it
    if (value && value.trim()) {
      return [{ id: generateId(), type: 'text', content: value, props: {} }];
    }
    return [];
  });
  const [view, setView] = useState<'editor' | 'preview' | 'code'>('editor');

  const syncBlocks = useCallback(
    (newBlocks: TemplateBlock[]) => {
      setBlocks(newBlocks);
      onChange(blocksToHtml(newBlocks));
    },
    [onChange]
  );

  const addBlock = useCallback(
    (type: BlockType) => {
      const newBlock = createBlock(type);
      syncBlocks([...blocks, newBlock]);
    },
    [blocks, syncBlocks]
  );

  const updateBlock = useCallback(
    (id: string, updated: TemplateBlock) => {
      syncBlocks(blocks.map((b) => (b.id === id ? updated : b)));
    },
    [blocks, syncBlocks]
  );

  const deleteBlock = useCallback(
    (id: string) => {
      syncBlocks(blocks.filter((b) => b.id !== id));
    },
    [blocks, syncBlocks]
  );

  const moveBlock = useCallback(
    (id: string, direction: -1 | 1) => {
      const idx = blocks.findIndex((b) => b.id === id);
      if (idx < 0) return;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= blocks.length) return;
      const newBlocks = [...blocks];
      [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
      syncBlocks(newBlocks);
    },
    [blocks, syncBlocks]
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar: view toggle + block palette */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Block palette */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
            {t('campaigns:builder.addBlock', { defaultValue: 'Add' })}
          </span>
          {BLOCK_TYPES.map(({ type, icon: Icon, label }) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs px-2"
              onClick={() => addBlock(type)}
            >
              <Icon className="h-3 w-3" />
              {label}
            </Button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
          <button
            onClick={() => setView('editor')}
            className={cn(
              'px-2 py-1 text-xs rounded transition-colors',
              view === 'editor' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Plus className="h-3 w-3 inline mr-1" />
            {t('campaigns:builder.editor', { defaultValue: 'Editor' })}
          </button>
          <button
            onClick={() => setView('preview')}
            className={cn(
              'px-2 py-1 text-xs rounded transition-colors',
              view === 'preview' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Eye className="h-3 w-3 inline mr-1" />
            {t('campaigns:builder.preview', { defaultValue: 'Preview' })}
          </button>
          <button
            onClick={() => setView('code')}
            className={cn(
              'px-2 py-1 text-xs rounded transition-colors',
              view === 'code' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Code className="h-3 w-3 inline mr-1" />
            HTML
          </button>
        </div>
      </div>

      {/* Editor view */}
      {view === 'editor' && (
        <div className="space-y-2">
          {blocks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {t('campaigns:builder.emptyState', { defaultValue: 'Start building your email template' })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('campaigns:builder.emptyHint', { defaultValue: 'Click the buttons above to add content blocks' })}
              </p>
            </div>
          )}
          {blocks.map((block, idx) => (
            <BlockEditor
              key={block.id}
              block={block}
              onUpdate={(updated) => updateBlock(block.id, updated)}
              onDelete={() => deleteBlock(block.id)}
              onMoveUp={() => moveBlock(block.id, -1)}
              onMoveDown={() => moveBlock(block.id, 1)}
              isFirst={idx === 0}
              isLast={idx === blocks.length - 1}
            />
          ))}
        </div>
      )}

      {/* Preview view */}
      {view === 'preview' && (
        <EmailPreview blocks={blocks} />
      )}

      {/* Code view */}
      {view === 'code' && (
        <Textarea
          value={blocksToHtml(blocks)}
          readOnly
          rows={12}
          className="font-mono text-xs"
        />
      )}
    </div>
  );
}
