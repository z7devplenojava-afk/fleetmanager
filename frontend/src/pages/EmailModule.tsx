import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Mail,
  Inbox,
  Send,
  Trash2,
  Star,
  Paperclip,
  Search,
  RefreshCw,
  Plus,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Reply,
  ReplyAll,
  Forward,
  Archive,
  FolderInput,
  Printer,
  FileUp,
  X,
  CheckSquare,
  Settings2,
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
  Globe,
  Server,
} from 'lucide-react';
import {
  emailAccountService,
  EmailAccount,
  EmailAccountRequest,
  EmailMessage,
  EmailFolder,
  PageResponse,
} from '@/services/emailAccountService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ==================== UTILS ====================

/** Sanitiza HTML vindo do servidor para impedir XSS/rastreadores. */
function sanitizeHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?<\/embed>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<base[^>]*>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<math[\s\S]*?<\/math>/gi, '')
    .replace(/on\w+\s*=\s*("|')[^"']*("|')/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/style\s*=\s*("|')[^"']*expression[^"']*("|')/gi, '')
    .replace(/<img([^>]*)\bsrc\s*=\s*("|')([^"']*)?("|')/gi, (match, attrs, q1, src, q2) =>
      // remove rastreadores de pixel (imagens 1x1) e fontes remotas suspeitas
      (src && src.toLowerCase().includes('pixel')) ? '' : match
    );
}

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(date?: string): string {
  if (!date) return '';
  try {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch {
    return date;
  }
}

function formatRelative(date?: string): string {
  if (!date) return '';
  try {
    const d = new Date(date);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return format(d, 'HH:mm');
    }
    return format(d, 'dd/MM');
  } catch {
    return date;
  }
}

function senderLabel(m: EmailMessage): string {
  const from = m.from && m.from.length > 0 ? m.from[0] : undefined;
  if (from?.name) return from.name;
  if (from?.address) return from.address;
  return 'Desconhecido';
}

function senderEmail(m: EmailMessage): string {
  const from = m.from && m.from.length > 0 ? m.from[0] : undefined;
  return from?.address ?? '';
}

function initials(name: string): string {
  return name
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('') || '?';
}

// ==================== MODAL DE CONEXÃO ====================

interface AccountFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  existing?: EmailAccount | null;
}

function inferServer(domain: string, type: 'imap' | 'smtp'): string {
  const d = domain.toLowerCase();
  if (d.includes('gmail.com')) return type === 'imap' ? 'imap.gmail.com' : 'smtp.gmail.com';
  if (d.includes('outlook.com') || d.includes('hotmail.com') || d.includes('live.com')) return type === 'imap' ? 'outlook.office365.com' : 'smtp-mail.outlook.com';
  if (d.includes('yahoo.com')) return type === 'imap' ? 'imap.mail.yahoo.com' : 'smtp.mail.yahoo.com';
  if (d.includes('zoho.com')) return type === 'imap' ? 'imap.zoho.com' : 'smtp.zoho.com';
  if (d.includes('icloud.com')) return type === 'imap' ? 'imap.mail.me.com' : 'smtp.mail.me.com';
  return type === 'imap' ? `imap.${domain}` : `smtp.${domain}`;
}

function AccountFormModal({ open, onClose, onSaved, existing }: AccountFormProps) {
  const [form, setForm] = useState<EmailAccountRequest>({
    emailAddress: '',
    displayName: '',
    imapHost: '',
    imapPort: 993,
    imapSsl: true,
    smtpHost: '',
    smtpPort: 587,
    smtpSsl: false,
    username: '',
    password: '',
    authType: 'PASSWORD',
    signature: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ imap?: boolean; smtp?: boolean; message?: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      setTestResult(null);
      if (existing) {
        setForm({
          emailAddress: existing.emailAddress,
          displayName: existing.displayName || '',
          imapHost: existing.imapHost,
          imapPort: existing.imapPort,
          imapSsl: existing.imapSsl,
          smtpHost: existing.smtpHost || '',
          smtpPort: existing.smtpPort || 587,
          smtpSsl: existing.smtpSsl,
          username: existing.username || '',
          password: '',
          authType: existing.authType || 'PASSWORD',
          signature: existing.signature || '',
        });
      } else {
        setForm({
          emailAddress: '',
          displayName: '',
          imapHost: '',
          imapPort: 993,
          imapSsl: true,
          smtpHost: '',
          smtpPort: 587,
          smtpSsl: false,
          username: '',
          password: '',
          authType: 'PASSWORD',
          signature: '',
        });
      }
    }
  }, [open, existing]);

  const set = (key: keyof EmailAccountRequest, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleEmailChange = (value: string) => {
    setForm(prev => {
      const domain = value.includes('@') ? value.split('@')[1] : '';
      const next = { ...prev, emailAddress: value };
      if (domain) {
        if (!prev.imapHost || prev.imapHost === inferServer(prev.emailAddress.split('@')[1] || '', 'imap')) {
          next.imapHost = inferServer(domain, 'imap');
        }
        if (!prev.smtpHost || prev.smtpHost === inferServer(prev.emailAddress.split('@')[1] || '', 'smtp')) {
          next.smtpHost = inferServer(domain, 'smtp');
        }
        if (!next.username) next.username = value;
      }
      return next;
    });
  };

  const validate = (): string => {
    if (!form.emailAddress || !form.emailAddress.includes('@')) return 'Informe um e-mail válido';
    if (!form.imapHost) return 'Informe o servidor IMAP';
    if (!form.imapPort) return 'Informe a porta IMAP';
    if (!form.password && !existing) return 'Informe a senha';
    return '';
  };

  const handleTest = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setTesting(true);
    setError('');
    setTestResult(null);
    try {
      const result = existing && !form.password
        ? await emailAccountService.testConnection(existing.id)
        : await emailAccountService.testCredentials(form);
      setTestResult({
        imap: result.imap?.ok,
        smtp: result.smtp?.ok ?? undefined,
        message: !result.success ? (result.imap?.message || result.smtp?.message) : 'Conexões OK',
      });
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Erro ao testar conexão');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (existing) {
        await emailAccountService.updateAccount(existing.id, form);
      } else {
        await emailAccountService.createAccount(form);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Erro ao salvar conta');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "bg-background border-border text-foreground placeholder:text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {existing ? 'Editar Conta de E-mail' : 'Conectar Conta de E-mail'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Informe as credenciais IMAP/SMTP. As senhas são armazenadas criptografadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>E-mail *</Label>
              <Input
                className={inputClass}
                value={form.emailAddress}
                onChange={e => handleEmailChange(e.target.value)}
                placeholder="usuario@empresa.com.br"
                disabled={!!existing}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Nome de exibição</Label>
              <Input
                className={inputClass}
                value={form.displayName || ''}
                onChange={e => set('displayName', e.target.value)}
                placeholder="Ex.: Financeiro"
              />
            </div>
            <div>
              <Label>Usuário IMAP</Label>
              <Input
                className={inputClass}
                value={form.username || ''}
                onChange={e => set('username', e.target.value)}
                placeholder="geralmente o e-mail"
              />
            </div>
            <div>
              <Label>Senha *</Label>
              <div className="relative">
                <Input
                  className={`${inputClass} pr-10`}
                  type={showPassword ? 'text' : 'password'}
                  value={form.password || ''}
                  onChange={e => set('password', e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-white">
              <Globe className="h-4 w-4 text-primary" /> Servidor IMAP (recebimento)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <Label>Host</Label>
                <Input
                  className={inputClass}
                  value={form.imapHost}
                  onChange={e => set('imapHost', e.target.value)}
                  placeholder="imap.empresa.com.br"
                />
              </div>
              <div>
                <Label>Porta</Label>
                <Input
                  className={inputClass}
                  type="number"
                  value={form.imapPort ?? 993}
                  onChange={e => set('imapPort', parseInt(e.target.value) || 993)}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <Switch checked={!!form.imapSsl} onCheckedChange={v => set('imapSsl', v)} />
                  SSL/TLS
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-white">
              <Server className="h-4 w-4 text-primary" /> Servidor SMTP (envio)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <Label>Host</Label>
                <Input
                  className={inputClass}
                  value={form.smtpHost || ''}
                  onChange={e => set('smtpHost', e.target.value)}
                  placeholder="smtp.empresa.com.br"
                />
              </div>
              <div>
                <Label>Porta</Label>
                <Input
                  className={inputClass}
                  type="number"
                  value={form.smtpPort ?? 587}
                  onChange={e => set('smtpPort', parseInt(e.target.value) || 587)}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <Switch checked={!!form.smtpSsl} onCheckedChange={v => set('smtpSsl', v)} />
                  SSL
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-white">
              <Settings2 className="h-4 w-4 text-primary" /> Assinatura (opcional)
            </div>
            <div className="space-y-2">
              <Label>Texto da assinatura</Label>
              <Textarea
                className={`${inputClass} min-h-[90px]`}
                value={form.signature || ''}
                onChange={e => set('signature', e.target.value)}
                placeholder={'--\nNome\nCargo | Empresa\nTelefone'}
              />
              <p className="text-xs text-muted-foreground">
                Inserida automaticamente no final das mensagens enviadas por esta conta.
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {testResult && (
            <div className="p-3 rounded-lg border border-border bg-background/50 text-sm space-y-1">
              <div className="flex items-center gap-2">
                {testResult.imap ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-muted-foreground">IMAP: {testResult.imap ? 'conexão OK' : 'falhou'}</span>
              </div>
              {testResult.smtp !== undefined && (
                <div className="flex items-center gap-2">
                  {testResult.smtp ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-muted-foreground">SMTP: {testResult.smtp ? 'conexão OK' : 'falhou'}</span>
                </div>
              )}
              {testResult.message && <p className="text-xs text-muted-foreground">{testResult.message}</p>}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-border text-muted-foreground">
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || saving}
            className="border-border text-primary"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
            Testar conexão
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {existing ? 'Salvar alterações' : 'Conectar conta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== MODAL DE COMPOSIÇÃO (Outlook-like) ====================

export type ComposeMode = 'new' | 'reply' | 'replyAll' | 'forward';

interface ComposeProps {
  open: boolean;
  onClose: () => void;
  account: EmailAccount;
  onSent?: () => void;
  mode?: ComposeMode;
  source?: EmailMessage | null;
}

function buildQuotedBody(source: EmailMessage, mode: ComposeMode): string {
  const fromLabel = `${senderLabel(source)} <${senderEmail(source)}>`;
  const dateLabel = formatDate(source.date) || 'data desconhecida';
  const header = mode === 'forward'
    ? `--- Mensagem original encaminhada ---\nDe: ${fromLabel}\nData: ${dateLabel}\nAssunto: ${source.subject || ''}\n`
    : `Em ${dateLabel}, ${fromLabel} escreveu:`;
  const quoted = (source.bodyText || '')
    .split('\n')
    .map(l => `> ${l}`)
    .join('\n')
    .slice(0, 4000);
  return `\n\n\n${header}\n${quoted}`;
}

function ComposeModal({ open, onClose, account, onSent, mode = 'new', source }: ComposeProps) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<{ id: string; fileName: string; sizeBytes?: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setError('');
    setAttachments([]);

    if (mode !== 'new' && source) {
      const fromAddr = senderEmail(source);
      if (mode === 'reply') {
        setTo(fromAddr);
        setCc('');
      } else if (mode === 'replyAll') {
        setTo(fromAddr);
        const self = account.emailAddress.toLowerCase();
        const ccList = [
          ...(source.to || []).map(t => t.address),
          ...(source.cc || []).map(c => c.address),
        ].filter((addr, i, arr) =>
          addr && addr.toLowerCase() !== self && arr.indexOf(addr) === i
        );
        setCc(ccList.join(', '));
      } else {
        setTo('');
        setCc('');
      }
      setBcc('');
      setSubject(
        source.subject
          ? (mode === 'forward'
              ? (source.subject.startsWith('Enc:') ? source.subject : `Enc: ${source.subject}`)
              : (source.subject.startsWith('Re:') ? source.subject : `Re: ${source.subject}`))
          : ''
      );
      setBody(buildQuotedBody(source, mode));
    } else {
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
    }
  }, [open, mode, source, account.emailAddress]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        const uploaded = await emailAccountService.uploadAttachment(account.id, file);
        setAttachments(prev => [...prev, uploaded]);
      }
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Erro ao anexar arquivo');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (!to.trim()) {
      setError('Informe o destinatário');
      return;
    }
    setSending(true);
    setError('');

    // Assinatura automática (como no Outlook): não duplica se já estiver no corpo
    let finalBody = body;
    const signature = account.signature?.trim();
    if (signature) {
      const cleanSig = signature.replace(/\r/g, '');
      const cleanBody = finalBody.replace(/\r/g, '');
      if (!cleanBody.includes(cleanSig)) {
        finalBody = finalBody ? `${finalBody}\n\n${signature}` : signature;
      }
    }

    try {
      await emailAccountService.sendEmail(account.id, {
        to: to,
        cc: cc || undefined,
        bcc: bcc || undefined,
        subject: subject || '(sem assunto)',
        bodyHtml: finalBody.replace(/\n/g, '<br/>'),
        attachmentIds: attachments.map(a => a.id),
      });
      onSent?.();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Erro ao enviar');
    } finally {
      setSending(false);
    }
  };

  const inputClass = "bg-background border-border text-foreground placeholder:text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            {mode === 'reply' ? 'Responder' : mode === 'replyAll' ? 'Responder a Todos' : mode === 'forward' ? 'Encaminhar' : 'Nova Mensagem'}
            {' · '}{account.emailAddress}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Para *</Label>
            <Input className={inputClass} value={to} onChange={e => setTo(e.target.value)} placeholder="destinatario@empresa.com" />
          </div>
          <div>
            <Label>Cópia (CC)</Label>
            <Input className={inputClass} value={cc} onChange={e => setCc(e.target.value)} placeholder="opcional" />
          </div>
          <div>
            <Label>Cópia oculta (CCO)</Label>
            <Input className={inputClass} value={bcc} onChange={e => setBcc(e.target.value)} placeholder="opcional" />
          </div>
          <div>
            <Label>Assunto</Label>
            <Input className={inputClass} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Assunto da mensagem" />
          </div>
          <div>
            <Label>Mensagem</Label>
            <Textarea
              className={`${inputClass} min-h-[180px]`}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Escreva sua mensagem..."
            />
          </div>

          {/* Anexos */}
          <div>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-border text-primary"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileUp className="h-4 w-4 mr-2" />}
                {uploading ? 'Enviando...' : 'Anexar arquivo'}
              </Button>
              {attachments.length > 0 && (
                <span className="text-xs text-muted-foreground">{attachments.length} anexo(s)</span>
              )}
            </div>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map(att => (
                  <span
                    key={att.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs"
                  >
                    <Paperclip className="h-3 w-3" />
                    <span className="max-w-[160px] truncate">{att.fileName}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                      className="hover:text-white transition-colors"
                      title="Remover anexo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {account.signature && (
            <p className="text-[11px] text-muted-foreground">
              ✍️ A assinatura da conta será adicionada ao enviar.
            </p>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border text-muted-foreground">
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== DIÁLOGO MOVER PARA PASTA ====================

interface MoveDialogProps {
  open: boolean;
  onClose: () => void;
  folders: EmailFolder[];
  currentFolderId?: string;
  count: number;
  onMove: (folder: EmailFolder) => void;
}

function MoveDialog({ open, onClose, folders, currentFolderId, count, onMove }: MoveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden bg-card border-border flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FolderInput className="h-5 w-5 text-primary" />
            Mover {count > 1 ? `${count} mensagens` : 'mensagem'} para
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Escolha a pasta de destino no servidor.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-1 py-2">
          {folders
            .filter(f => f.id !== currentFolderId)
            .map(folder => (
              <button
                key={folder.id}
                onClick={() => onMove(folder)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-colors hover:bg-white/5 hover:text-white text-muted-foreground"
              >
                <Inbox className="h-4 w-4 flex-shrink-0" />
                <span className="truncate flex-1">{folder.displayName || folder.remoteName}</span>
                {folder.unread ? <Badge className="bg-primary text-white text-xs">{folder.unread}</Badge> : null}
              </button>
            ))}
          {folders.length <= 1 && (
            <p className="text-xs text-muted-foreground px-3 py-4">
              Nenhuma outra pasta disponível. Sincronize as pastas da conta para listar mais.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border text-muted-foreground">
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== PÁGINA PRINCIPAL ====================

export default function EmailModule() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(null);
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<EmailFolder | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [fullSync, setFullSync] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>('new');
  const [composeSource, setComposeSource] = useState<EmailMessage | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [folderError, setFolderError] = useState('');

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 5000);
  };

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const data = await emailAccountService.listAccounts();
      setAccounts(data);
      setSelectedAccount(prev => {
        if (prev && data.some(a => a.id === prev.id)) return prev;
        return data.length > 0 ? data[0] : null;
      });
    } catch (e: any) {
      showNotice(e.response?.data?.error || 'Erro ao carregar contas');
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  const loadFolders = useCallback(async (accountId: string) => {
    try {
      const data = await emailAccountService.listFolders(accountId);
      setFolders(data);
      setFolderError('');
      const inbox = data.find(f => f.remoteName.toUpperCase() === 'INBOX') || data[0];
      setSelectedFolder(inbox || null);
      setSelectedMessage(null);
      setSelectedIds(new Set());
      setPage(0);
    } catch (e: any) {
      setFolderError(e.response?.data?.error || 'Erro ao listar pastas');
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (selectedAccount) {
      loadFolders(selectedAccount.id);
    } else {
      setFolders([]);
      setMessages([]);
    }
  }, [selectedAccount, loadFolders]);

  const loadMessages = useCallback(async (folder: EmailFolder | null, account: EmailAccount | null, pageNum: number) => {
    if (!account) return;
    setLoadingMessages(true);
    setSelectedMessage(null);
    setSelectedIds(new Set());
    try {
      let data: PageResponse<EmailMessage>;
      if (search.trim()) {
        data = await emailAccountService.searchMessages(account.id, search.trim(), pageNum, 25);
      } else if (folder) {
        data = await emailAccountService.listFolderMessages(folder.id, pageNum, 25);
      } else {
        data = await emailAccountService.listAccountMessages(account.id, undefined, pageNum, 25);
      }
      setMessages(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setPage(pageNum);
    } catch (e: any) {
      showNotice(e.response?.data?.error || 'Erro ao carregar mensagens');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [search]);

  useEffect(() => {
    if (selectedAccount) {
      loadMessages(selectedFolder, selectedAccount, page);
    }
  }, [selectedFolder, selectedAccount, search, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenMessage = async (msg: EmailMessage) => {
    setLoadingMessage(true);
    try {
      const full = await emailAccountService.getMessage(msg.id);
      setSelectedMessage(full);
      setMessages(prev => prev.map(m => (m.id === full.id ? full : m)));
    } catch (e: any) {
      showNotice(e.response?.data?.error || 'Erro ao abrir mensagem');
    } finally {
      setLoadingMessage(false);
    }
  };

  const handleSync = async () => {
    if (!selectedAccount) return;
    setSyncing(true);
    setSearch('');
    try {
      const result = await emailAccountService.syncAccount(selectedAccount.id, fullSync);
      showNotice(result?.message || 'Sincronização concluída');
      await loadAccounts();
      await loadFolders(selectedAccount.id);
    } catch (e: any) {
      showNotice(e.response?.data?.error || 'Erro na sincronização');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleFlag = async (msg: EmailMessage, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updated = await emailAccountService.toggleFlag(msg.id);
      setMessages(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      if (selectedMessage?.id === updated.id) setSelectedMessage(updated);
    } catch {
      showNotice('Erro ao alterar flag');
    }
  };

  const handleToggleRead = async (msg: EmailMessage, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updated = await emailAccountService.markRead(msg.id, !msg.read);
      setMessages(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      if (selectedMessage?.id === updated.id) setSelectedMessage(updated);
    } catch {
      showNotice('Erro ao alterar leitura');
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    try {
      await emailAccountService.deleteMessage(selectedMessage.id);
      setSelectedMessage(null);
      setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
      showNotice('Mensagem excluída');
    } catch (e: any) {
      showNotice(e.response?.data?.error || 'Erro ao excluir');
    }
  };

  const openCompose = () => {
    setComposeMode('new');
    setComposeSource(null);
    setComposeOpen(true);
  };

  const openReply = () => {
    if (selectedMessage) {
      setComposeMode('reply');
      setComposeSource(selectedMessage);
      setComposeOpen(true);
    }
  };

  const openReplyAll = () => {
    if (selectedMessage) {
      setComposeMode('replyAll');
      setComposeSource(selectedMessage);
      setComposeOpen(true);
    }
  };

  const openForward = () => {
    if (selectedMessage) {
      setComposeMode('forward');
      setComposeSource(selectedMessage);
      setComposeOpen(true);
    }
  };

  const handleRemoveAccount = async (account: EmailAccount) => {
    if (!window.confirm(`Remover a conta ${account.emailAddress} e todos os dados sincronizados?`)) return;
    try {
      await emailAccountService.deleteAccount(account.id);
      if (selectedAccount?.id === account.id) setSelectedAccount(null);
      await loadAccounts();
      showNotice('Conta removida');
    } catch (e: any) {
      showNotice(e.response?.data?.error || 'Erro ao remover conta');
    }
  };

  // ==================== SELEÇÃO MÚLTIPLA ====================

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (prev.size === messages.length && messages.length > 0) {
        return new Set();
      }
      return new Set(messages.map(m => m.id));
    });
  };

  const selectedCount = selectedIds.size;

  const runBulkAction = async (type: 'delete' | 'read' | 'unread' | 'flag') => {
    if (selectedCount === 0) return;
    const ids = Array.from(selectedIds);
    try {
      if (type === 'delete') {
        await Promise.all(ids.map(id => emailAccountService.deleteMessage(id)));
        showNotice(`${ids.length} mensagens excluídas`);
      } else if (type === 'read' || type === 'unread') {
        await Promise.all(ids.map(id => emailAccountService.markRead(id, type === 'read')));
        showNotice(`${ids.length} mensagens marcadas como ${type === 'read' ? 'lidas' : 'não lidas'}`);
      } else {
        await Promise.all(ids.map(id => emailAccountService.toggleFlag(id)));
        showNotice(`${ids.length} mensagens marcadas como importante`);
      }
      setSelectedIds(new Set());
      await loadMessages(selectedFolder, selectedAccount, page);
    } catch (e: any) {
      showNotice(e.response?.data?.error || 'Erro na ação em lote');
    }
  };

  // ==================== MOVER / ARQUIVAR ====================

  const moveMessages = async (target: EmailFolder) => {
    const ids = selectedCount > 0 ? Array.from(selectedIds) : (selectedMessage ? [selectedMessage.id] : []);
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map(id => emailAccountService.moveMessage(id, target.id)));
      setMoveDialogOpen(false);
      setSelectedIds(new Set());
      setSelectedMessage(null);
      await loadMessages(selectedFolder, selectedAccount, page);
      showNotice(`${ids.length} mensagem(ns) movida(s) para ${target.displayName || target.remoteName}. Aparecerá na pasta após a sincronização.`);
    } catch (e: any) {
      showNotice(e.response?.data?.error || 'Erro ao mover mensagem');
    }
  };

  const openMoveDialog = () => {
    if (selectedCount > 0 || selectedMessage) {
      setMoveDialogOpen(true);
    }
  };

  const handleArchive = () => {
    if (selectedCount === 0 && !selectedMessage) return;
    const target = folders.find(f => /archive|arquivo/i.test(`${f.remoteName} ${f.displayName || ''}`));
    if (target) {
      moveMessages(target);
    } else {
      setMoveDialogOpen(true);
    }
  };

  // ==================== IMPRIMIR ====================

  const handlePrint = () => {
    if (!selectedMessage) return;
    const m = selectedMessage;
    const atts = (m.attachments || [])
      .filter(a => !a.inline)
      .map(a =>
        `<a href="${window.location.origin}${emailAccountService.downloadAttachmentUrl(a.id)}">📎 ${escapeHtml(a.fileName)}</a>`
      )
      .join('<br/>');
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    w.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(m.subject || 'E-mail')}</title>` +
      `<style>body{font-family:Arial,sans-serif;margin:40px;color:#222;line-height:1.5}h1{font-size:20px;margin-bottom:4px}` +
      `.meta{font-size:12px;color:#555;margin-bottom:16px}.body{margin-top:16px}img{max-width:100%}` +
      `@media print{body{margin:20mm}}</style></head><body>` +
      `<h1>${escapeHtml(m.subject || '(sem assunto)')}</h1>` +
      `<div class="meta"><b>De:</b> ${escapeHtml(senderLabel(m))} &lt;${escapeHtml(senderEmail(m))}&gt;<br/>` +
      `<b>Para:</b> ${escapeHtml((m.to || []).map(t => t.address).join(', ') || '-')}` +
      (m.cc && m.cc.length ? `<br/><b>CC:</b> ${escapeHtml(m.cc.map(c => c.address).join(', '))}` : '') +
      `<br/><b>Data:</b> ${escapeHtml(formatDate(m.date))}</div><hr/>` +
      `<div class="body">${m.bodyHtml ? sanitizeHtml(m.bodyHtml) : `<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(m.bodyText || '')}</pre>`}</div>` +
      (atts ? `<hr/><div>${atts}</div>` : '') +
      `</body></html>`
    );
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const unreadTotal = useMemo(
    () => accounts.reduce((sum, a) => sum + a.unreadCount, 0),
    [accounts]
  );

  return (
    <StandardLayout
      title="Gestão de E-mails"
      subtitle="Conecte suas contas IMAP/SMTP e gerencie tudo em um só lugar"
    >
      {notice && (
        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {notice}
        </div>
      )}

      {/* Header de ações */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedAccount?.id ?? ''}
            onChange={e => {
              const acc = accounts.find(a => a.id === e.target.value);
              setSelectedAccount(acc || null);
            }}
            className="bg-card border border-border text-foreground rounded-lg px-3 py-2 text-sm max-w-[280px]"
          >
            <option value="">Selecione uma conta</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.emailAddress} {a.unreadCount > 0 ? `(${a.unreadCount} não lidas)` : ''}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            className="border-border text-primary"
            onClick={() => { setEditingAccount(null); setAccountModalOpen(true); }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova conta
          </Button>

          {selectedAccount && (
            <Button
              variant="outline"
              className="border-border text-muted-foreground"
              onClick={() => { setEditingAccount(selectedAccount); setAccountModalOpen(true); }}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          )}

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={fullSync} onCheckedChange={setFullSync} />
            Sincronização completa
          </label>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="bg-card border-border text-foreground pl-9"
              placeholder="Buscar mensagens..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={handleSync}
            disabled={!selectedAccount || syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={openCompose}
            disabled={!selectedAccount}
          >
            <Send className="h-4 w-4 mr-2" />
            Novo E-mail
          </Button>
        </div>
      </div>

      {accounts.length === 0 && !loadingAccounts ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Nenhuma conta conectada</h3>
            <p className="text-muted-foreground text-sm max-w-md mb-6">
              Conecte uma conta de e-mail informando as credenciais IMAP/SMTP. O sistema
              importará pastas e mensagens e permitirá enviar pelo SMTP.
            </p>
            <Button onClick={() => { setEditingAccount(null); setAccountModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Conectar primeira conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="flex h-[calc(100vh-320px)] min-h-[480px]">
              {/* COLUNA 1 - Pastas */}
              <div className="w-60 border-r border-border flex flex-col flex-shrink-0 bg-background/40">
                <div className="p-3 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Pastas
                  </p>
                  {folderError && <p className="text-xs text-red-400">{folderError}</p>}
                  {loadingMessages && folders.length === 0 ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-3/4" />
                    </div>
                  ) : null}
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {folders.map(folder => (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
                        selectedFolder?.id === folder.id
                          ? 'bg-primary/15 text-primary border border-primary/30'
                          : 'text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent'
                      }`}
                    >
                      <Inbox className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate flex-1 text-left">{folder.displayName || folder.remoteName}</span>
                      {folder.unread ? (
                        <Badge className="bg-primary text-white text-xs">{folder.unread}</Badge>
                      ) : null}
                    </button>
                  ))}
                  {folders.length === 0 && !loadingMessages && (
                    <p className="text-xs text-muted-foreground px-3 py-4">
                      Nenhuma pasta. Clique em Sincronizar para importar.
                    </p>
                  )}
                </div>
              </div>

              {/* COLUNA 2 - Lista de mensagens */}
              <div className="flex-1 flex flex-col min-w-0 border-r border-border">
                <div className="p-3 border-b border-border flex items-center justify-between gap-2 bg-background/40 flex-wrap">
                  {selectedCount > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-white mr-1">
                        {selectedCount} selecionada{selectedCount > 1 ? 's' : ''}
                      </span>
                      <Button variant="ghost" size="sm" className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => runBulkAction('delete')}>
                        <Trash2 className="h-4 w-4 mr-1.5" />Excluir
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-white" onClick={() => runBulkAction('read')}>
                        <Eye className="h-4 w-4 mr-1.5" />Lida
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-white" onClick={() => runBulkAction('unread')}>
                        <EyeOff className="h-4 w-4 mr-1.5" />Não lida
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-yellow-400" onClick={() => runBulkAction('flag')}>
                        <Star className="h-4 w-4 mr-1.5" />Importante
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-white" onClick={openMoveDialog}>
                        <FolderInput className="h-4 w-4 mr-1.5" />Mover
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-white" onClick={() => setSelectedIds(new Set())}>
                        <X className="h-4 w-4 mr-1.5" />Limpar
                      </Button>
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {search ? 'Resultados da busca' : (selectedFolder?.displayName || selectedFolder?.remoteName || 'Mensagens')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {messages.length} exibidas
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={toggleSelectAll}
                      title={selectedIds.size === messages.length ? 'Desmarcar todas' : 'Selecionar todas'}
                    >
                      <CheckSquare className="h-4 w-4" fill={selectedIds.size === messages.length ? 'currentColor' : 'none'} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      disabled={page <= 0}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">{page + 1}/{Math.max(totalPages, 1)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loadingMessages ? (
                    <div className="p-4 space-y-3">
                      {[0, 1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <Inbox className="h-10 w-10 text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground text-sm">
                        {search ? 'Nenhum resultado para a busca' : 'Caixa vazia'}
                      </p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div
                        key={msg.id}
                        onClick={() => handleOpenMessage(msg)}
                        className={`flex items-center gap-2.5 px-3 py-3 border-b border-border cursor-pointer transition-colors group ${
                          selectedMessage?.id === msg.id
                            ? 'bg-primary/10 border-l-2 border-l-primary'
                            : 'hover:bg-white/5 border-l-2 border-l-transparent'
                        } ${selectedIds.has(msg.id) ? 'bg-primary/5' : ''} ${msg.read ? 'opacity-70' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(msg.id)}
                          onChange={() => toggleSelect(msg.id)}
                          onClick={e => e.stopPropagation()}
                          className="flex-shrink-0 accent-primary"
                          title="Selecionar para ação em lote"
                        />
                        <button
                          onClick={e => handleToggleFlag(msg, e)}
                          className={`flex-shrink-0 transition-colors ${msg.flagged ? 'text-yellow-400' : 'text-muted-foreground/40 hover:text-yellow-400'}`}
                          title={msg.flagged ? 'Desmarcar' : 'Marcar como importante'}
                        >
                          <Star className="h-4 w-4" fill={msg.flagged ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={e => handleToggleRead(msg, e)}
                          className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${msg.read ? 'bg-muted-foreground/30' : 'bg-primary'}`}
                          title={msg.read ? 'Marcar como não lida' : 'Marcar como lida'}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm truncate ${msg.read ? 'text-muted-foreground' : 'text-white font-semibold'}`}>
                              {senderLabel(msg)}
                            </span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatRelative(msg.date)}
                            </span>
                          </div>
                          <p className={`text-sm truncate ${msg.read ? 'text-muted-foreground' : 'text-white'}`}>
                            {msg.subject || '(sem assunto)'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {msg.hasAttachments && <Paperclip className="h-3 w-3 inline mr-1" />}
                            {senderEmail(msg)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* COLUNA 3 - Leitura */}
              <div className="flex-1 min-w-0 flex flex-col bg-background/60">
                {loadingMessage ? (
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-40 w-full mt-6" />
                  </div>
                ) : selectedMessage ? (
                  <>
                    {/* TOOLBAR VISÍVEL (estilo Outlook) */}
                    <div className="flex items-center gap-1.5 flex-wrap px-3 py-2 border-b border-border bg-background/40">
                      <Button size="sm" className="h-8 text-white" onClick={openReply} title="Responder ao remetente">
                        <Reply className="h-4 w-4 mr-1.5" />Responder
                      </Button>
                      <Button size="sm" className="h-8 text-white" onClick={openReplyAll} title="Responder ao remetente e a todos">
                        <ReplyAll className="h-4 w-4 mr-1.5" />Responder Todos
                      </Button>
                      <Button size="sm" className="h-8 text-white" onClick={openForward} title="Encaminhar esta mensagem">
                        <Forward className="h-4 w-4 mr-1.5" />Encaminhar
                      </Button>
                      <div className="w-px h-5 bg-border mx-1" />
                      <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-red-400" onClick={handleDeleteMessage} title="Excluir mensagem">
                        <Trash2 className="h-4 w-4 mr-1.5" />Excluir
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-white" onClick={handleArchive} title="Arquivar (mover para a pasta Arquivo)">
                        <Archive className="h-4 w-4 mr-1.5" />Arquivar
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-white" onClick={openMoveDialog} title="Mover para outra pasta">
                        <FolderInput className="h-4 w-4 mr-1.5" />Mover
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-white" onClick={() => handleToggleRead(selectedMessage)} title={selectedMessage.read ? 'Marcar como não lida' : 'Marcar como lida'}>
                        {selectedMessage.read ? <EyeOff className="h-4 w-4 mr-1.5" /> : <Eye className="h-4 w-4 mr-1.5" />}
                        {selectedMessage.read ? 'Não lida' : 'Lida'}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-yellow-400" onClick={() => handleToggleFlag(selectedMessage)} title={selectedMessage.flagged ? 'Desmarcar importante' : 'Marcar como importante'}>
                        <Star className="h-4 w-4 mr-1.5" fill={selectedMessage.flagged ? 'currentColor' : 'none'} />
                        {selectedMessage.flagged ? 'Desmarcar' : 'Importante'}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-white" onClick={handlePrint} title="Imprimir mensagem">
                        <Printer className="h-4 w-4 mr-1.5" />Imprimir
                      </Button>
                    </div>

                    <div className="p-4 border-b border-border flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-white leading-tight mb-1">
                          {selectedMessage.subject || '(sem assunto)'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{senderLabel(selectedMessage)}</span>
                          <span>&lt;{senderEmail(selectedMessage)}&gt;</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Para: {(selectedMessage.to || []).map(t => t.address).join(', ') || '-'}
                          {selectedMessage.cc && selectedMessage.cc.length > 0 &&
                            ` · CC: ${selectedMessage.cc.map(c => c.address).join(', ')}`}
                          {' '}· {formatDate(selectedMessage.date)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {selectedMessage.hasAttachments && (
                          <div className="flex flex-wrap justify-end gap-1 max-w-[240px]">
                            {(selectedMessage.attachments || []).filter(a => !a.inline).map(att => (
                              <a
                                key={att.id}
                                href={emailAccountService.downloadAttachmentUrl(att.id)}
                                className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs hover:bg-primary/20 transition-colors"
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Paperclip className="h-3 w-3" />
                                <span className="max-w-[120px] truncate">{att.fileName}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                      {selectedMessage.bodyHtml ? (
                        <div
                          className="email-body text-white prose prose-invert max-w-none [&_img]:max-w-full"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedMessage.bodyHtml) }}
                        />
                      ) : selectedMessage.bodyText ? (
                        <pre className="whitespace-pre-wrap font-sans text-sm text-white">{selectedMessage.bodyText}</pre>
                      ) : (
                        <p className="text-muted-foreground text-sm">(Sem conteúdo textual)</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <User className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-muted-foreground text-sm max-w-xs">
                      Selecione uma mensagem para ler. Use a busca para localizar por remetente, assunto ou conteúdo.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de contas conectadas */}
      {accounts.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-white mb-2">Contas conectadas</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {accounts.map(acc => (
              <div key={acc.id} className="p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-bold">
                    {initials(acc.displayName || acc.emailAddress)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{acc.displayName || acc.emailAddress}</p>
                    <p className="text-xs text-muted-foreground truncate">{acc.emailAddress}</p>
                  </div>
                  <Badge variant={acc.status === 'ACTIVE' ? 'default' : 'destructive'} className="text-xs">
                    {acc.status === 'ACTIVE' ? 'Ativa' : acc.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="rounded-lg bg-background/50 p-2">
                    <p className="text-lg font-bold text-white">{acc.totalMessages}</p>
                    <p className="text-[10px] text-muted-foreground">Mensagens</p>
                  </div>
                  <div className="rounded-lg bg-background/50 p-2">
                    <p className="text-lg font-bold text-primary">{acc.unreadCount}</p>
                    <p className="text-[10px] text-muted-foreground">Não lidas</p>
                  </div>
                  <div className="rounded-lg bg-background/50 p-2">
                    <p className="text-lg font-bold text-white">{acc.folderCount}</p>
                    <p className="text-[10px] text-muted-foreground">Pastas</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    {acc.lastSyncStatus === 'SUCCESS' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : acc.lastSyncStatus === 'ERROR' ? (
                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="text-muted-foreground">
                      {acc.lastSyncAt ? `Última sync: ${formatRelative(acc.lastSyncAt)}` : 'Nunca sincronizada'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white" onClick={() => { setEditingAccount(acc); setAccountModalOpen(true); }} title="Editar">
                      <Settings2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-400" onClick={() => handleRemoveAccount(acc)} title="Remover">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AccountFormModal
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        onSaved={() => { loadAccounts(); showNotice('Conta salva'); }}
        existing={editingAccount}
      />
      {selectedAccount && (
        <ComposeModal
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
          account={selectedAccount}
          mode={composeMode}
          source={composeSource}
          onSent={() => showNotice('E-mail enviado!')}
        />
      )}
      <MoveDialog
        open={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        folders={folders}
        currentFolderId={selectedFolder?.id}
        count={Math.max(selectedCount, selectedMessage ? 1 : 0)}
        onMove={moveMessages}
      />
    </StandardLayout>
  );
}
