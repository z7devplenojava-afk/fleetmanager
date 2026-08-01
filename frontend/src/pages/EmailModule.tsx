import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
        // Conta já salva: testa com as credenciais armazenadas (senha em branco = manter)
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

// ==================== MODAL DE COMPOSIÇÃO ====================

interface ComposeProps {
  open: boolean;
  onClose: () => void;
  account: EmailAccount;
  onSent?: () => void;
  replyTo?: EmailMessage | null;
}

function ComposeModal({ open, onClose, account, onSent, replyTo }: ComposeProps) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && replyTo) {
      const from = replyTo.from && replyTo.from.length > 0 ? replyTo.from[0].address : '';
      setTo(from);
      setCc('');
      setSubject(replyTo.subject?.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject || ''}`);
      setBody(`\n\n\n---\nEm ${formatDate(replyTo.date)}, ${senderLabel(replyTo)} escreveu:\n> ${(replyTo.bodyText || '').replace(/\n/g, '\n> ').slice(0, 2000)}`);
    } else if (open) {
      setTo('');
      setCc('');
      setSubject('');
      setBody('');
      setError('');
    }
  }, [open, replyTo]);

  const handleSend = async () => {
    if (!to.trim()) {
      setError('Informe o destinatário');
      return;
    }
    setSending(true);
    setError('');
    try {
      await emailAccountService.sendEmail(account.id, {
        to: to,
        cc: cc || undefined,
        subject: subject || '(sem assunto)',
        bodyHtml: body.replace(/\n/g, '<br/>'),
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
            {replyTo ? 'Responder' : 'Nova Mensagem'} · {account.emailAddress}
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
            <Label>Assunto</Label>
            <Input className={inputClass} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Assunto da mensagem" />
          </div>
          <div>
            <Label>Mensagem</Label>
            <Textarea
              className={`${inputClass} min-h-[200px]`}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Escreva sua mensagem..."
            />
          </div>
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

// ==================== PÁGINA PRINCIPAL ====================

export default function EmailModule() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(null);
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<EmailFolder | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
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
  const [replyTo, setReplyTo] = useState<EmailMessage | null>(null);
  const [notice, setNotice] = useState('');
  const [folderError, setFolderError] = useState('');

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const data = await emailAccountService.listAccounts();
      setAccounts(data);
      // Preserva a seleção atual sempre que possível (evita reset inesperado)
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
    } catch (err) {
      showNotice('Erro ao alterar flag');
    }
  };

  const handleToggleRead = async (msg: EmailMessage, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updated = await emailAccountService.markRead(msg.id, !msg.read);
      setMessages(prev => prev.map(m => (m.id === updated.id ? updated : m)));
    } catch (err) {
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
    setReplyTo(null);
    setComposeOpen(true);
  };

  const openReply = () => {
    if (selectedMessage) {
      setReplyTo(selectedMessage);
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
            Escrever
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
                <div className="p-3 border-b border-border flex items-center justify-between bg-background/40">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {search ? 'Resultados da busca' : (selectedFolder?.displayName || selectedFolder?.remoteName || 'Mensagens')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {messages.length} exibidas
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
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
                        className={`flex items-center gap-3 px-4 py-3 border-b border-border cursor-pointer transition-colors group ${
                          selectedMessage?.id === msg.id
                            ? 'bg-primary/10 border-l-2 border-l-primary'
                            : 'hover:bg-white/5 border-l-2 border-l-transparent'
                        } ${msg.read ? 'opacity-70' : ''}`}
                      >
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
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={openReply} title="Responder">
                            <Reply className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleToggleFlag(selectedMessage)} title="Importante">
                            <Star className="h-4 w-4" fill={selectedMessage.flagged ? 'currentColor' : 'none'} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleDeleteMessage} title="Excluir">
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
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
          replyTo={replyTo}
          onSent={() => showNotice('E-mail enviado!')}
        />
      )}
    </StandardLayout>
  );
}
