import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Upload, Save, RefreshCw, Clock, Image as ImageIcon, Shield, Plus, Trash2, RotateCcw, Smartphone, Palette, Globe, ToggleLeft, ToggleRight } from 'lucide-react';

interface SettingRow {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  updatedAt: string;
  updatedBy?: string | null;
}

function useDebouncedCallback<T extends any[]>(fn: (...args: T) => void, delay = 500) {
  const timeoutRef = useRef<number | undefined>();
  return useCallback((...args: T) => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

interface WebhookItem { id: string; tenantId: string; webhookUrl: string; secretToken: string; status: string; createdAt: string }
interface WebhookLog { id: string; webhookId: string; eventType: string; createdAt: string; responseStatus: number; payload: any }

export default function SystemSettingsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, SettingRow>>({});

  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [filters, setFilters] = useState<{ tenantId?: string; eventType?: string }>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const upsert = async (key: string, value: any, type?: SettingRow['type']) => {
    setSaving(true);
    try {
      await api.post('/admin/settings', { key, value, type });
      setSettings((prev) => ({
        ...prev,
        [key]: {
          key,
          value,
          type: (type as any) || prev[key]?.type || 'string',
          updatedAt: new Date().toISOString(),
          updatedBy: user?.id || null,
        },
      }));
      toast.success('Configuração salva');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const debouncedUpsert = useDebouncedCallback(upsert, 600);

  const loadWebhooks = async () => {
    const { data } = await api.get('/admin/webhooks');
    setWebhooks(data.items as WebhookItem[]);
  };

  const loadLogs = async () => {
    const params = new URLSearchParams();
    if (filters.tenantId) params.set('tenantId', filters.tenantId);
    if (filters.eventType) params.set('eventType', filters.eventType);
    const { data } = await api.get(`/admin/webhooks/logs?${params.toString()}`);
    setLogs(data.items as WebhookLog[]);
  };

  useEffect(() => { loadLogs(); }, [filters.tenantId, filters.eventType]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/admin/settings');
        const map: Record<string, SettingRow> = {};
        for (const s of data.settings as SettingRow[]) {
          map[s.key] = s;
        }
        setSettings(map);
        await loadWebhooks();
        await loadLogs();
      } catch (e: any) {
        toast.error(e?.response?.data?.error || 'Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const get = (key: string, fallback: any = '') => settings[key]?.value ?? fallback;

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      debouncedUpsert('branding.logoBase64', base64, 'string');
    };
    reader.readAsDataURL(file);
  };

  const createWebhook = async () => {
    const tenantId = get('tenant.id', 'client_001');
    const secretToken = get('webhook.secret', 'defina-um-segredo');
    const webhookUrl = `${window.location.origin}/api/webhook/${tenantId}`;
    await api.post('/admin/webhooks', { tenantId, secretToken, webhookUrl, status: 'active' });
    toast.success('Webhook salvo');
    await loadWebhooks();
  };

  const saveWebhook = async (item: WebhookItem) => {
    await api.post('/admin/webhooks', item);
    toast.success('Webhook atualizado');
    await loadWebhooks();
  };

  const deleteWebhook = async (id: string) => {
    await api.delete(`/admin/webhooks/${id}`);
    toast.success('Webhook removido');
    await loadWebhooks();
  };

  const resendLog = async (logId: string) => {
    await api.post(`/admin/webhooks/logs/${logId}/resend`);
    toast.success('Evento reenviado');
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Carregando configurações...</p>
      </div>
    );
  }

  const tenantId = get('tenant.id', 'client_001');
  const webhookSecret = get('webhook.secret', 'defina-um-segredo');
  const webhookUrl = `${window.location.origin}/api/webhook/${tenantId}`;
  const n8nUrl = get('n8n.incomingUrl', '');
  const n8nSecret = get('n8n.secret', '');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
        <p className="text-gray-600">Central de controle administrativa. As alterações impactam todo o sistema.</p>
      </div>

      {/* Identidade do Sistema */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <ImageIcon className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Identidade do Sistema</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Sistema (exibido no login e header)</label>
              <input
                type="text"
                className="input"
                defaultValue={get('branding.appName', 'Sistema de Embarcações')}
                onChange={(e) => {
                  debouncedUpsert('branding.appName', e.target.value, 'string');
                  // manter PWA em sincronia automaticamente
                  debouncedUpsert('pwa.name', e.target.value, 'string');
                  debouncedUpsert('pwa.shortName', e.target.value.substring(0, 12), 'string');
                }}
                placeholder="Nome do seu sistema"
              />
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo da Empresa</label>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0])} />
              <button className="btn btn-secondary" onClick={() => upsert('branding.logoBase64', '', 'string')}>
                <RefreshCw className="w-4 h-4 mr-2" /> Redefinir
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">PNG/JPG/SVG. Será armazenada de forma segura.</p>
          </div>
          <div className="justify-self-center">
            {get('branding.logoBase64') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={get('branding.logoBase64')} alt="Logo" className="h-16 object-contain" />
            ) : (
              <div className="h-16 w-32 bg-gray-100 flex items-center justify-center text-gray-400">Sem logo</div>
            )}
          </div>
        </div>
      </div>

      {/* Lógicas de Agendamento */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Lógicas de Agendamento</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tempo mínimo (horas)</label>
            <input
              type="number"
              className="input"
              defaultValue={get('booking.minAdvanceHours', 24)}
              onChange={(e) => debouncedUpsert('booking.minAdvanceHours', Number(e.target.value), 'number')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Permitir mesmo dia</label>
            <select
              className="input"
              defaultValue={get('booking.allowSameDay', false) ? 'yes' : 'no'}
              onChange={(e) => debouncedUpsert('booking.allowSameDay', e.target.value === 'yes', 'boolean')}
            >
              <option value="yes">Sim</option>
              <option value="no">Não</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Máximo de dias à frente</label>
            <input
              type="number"
              className="input"
              placeholder="Opcional"
              defaultValue={get('booking.maxDaysAhead', 60)}
              onChange={(e) => debouncedUpsert('booking.maxDaysAhead', Number(e.target.value), 'number')}
            />
          </div>
        </div>
      </div>

      {/* Configuração PWA */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Smartphone className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Configuração PWA</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">Configure o Progressive Web App para instalação em dispositivos móveis.</p>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do App *</label>
              <input
                type="text"
                className="input"
                defaultValue={get('pwa.name', 'Sistema Embarcações')}
                onChange={(e) => debouncedUpsert('pwa.name', e.target.value, 'string')}
                placeholder="Sistema Embarcações"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Curto *</label>
              <input
                type="text"
                className="input"
                defaultValue={get('pwa.shortName', 'Embarcações')}
                onChange={(e) => debouncedUpsert('pwa.shortName', e.target.value, 'string')}
                placeholder="Embarcações"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              className="input"
              rows={2}
              defaultValue={get('pwa.description', 'Sistema completo de agendamentos para embarcações')}
              onChange={(e) => debouncedUpsert('pwa.description', e.target.value, 'string')}
              placeholder="Descrição do aplicativo"
            />
          </div>

          {/* Cores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Cor Primária (Theme Color)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                  defaultValue={get('pwa.themeColor', '#3b82f6')}
                  onChange={(e) => debouncedUpsert('pwa.themeColor', e.target.value, 'string')}
                />
                <input
                  type="text"
                  className="input flex-1"
                  defaultValue={get('pwa.themeColor', '#3b82f6')}
                  onChange={(e) => debouncedUpsert('pwa.themeColor', e.target.value, 'string')}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Cor de Fundo (Background Color)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                  defaultValue={get('pwa.backgroundColor', '#ffffff')}
                  onChange={(e) => debouncedUpsert('pwa.backgroundColor', e.target.value, 'string')}
                />
                <input
                  type="text"
                  className="input flex-1"
                  defaultValue={get('pwa.backgroundColor', '#ffffff')}
                  onChange={(e) => debouncedUpsert('pwa.backgroundColor', e.target.value, 'string')}
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>

          {/* Ícone do App */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ícone do App (PNG/SVG)</label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/png,image/svg+xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const base64 = reader.result as string;
                      debouncedUpsert('pwa.iconBase64', base64, 'string');
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
              <div className="w-16 h-16 border-2 border-gray-200 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                {get('pwa.iconBase64') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={get('pwa.iconBase64')} alt="PWA Icon" className="w-full h-full object-contain" />
                ) : (
                  <Smartphone className="w-8 h-8 text-gray-400" />
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Recomendado: 512x512px PNG ou SVG. Será redimensionado automaticamente.</p>
          </div>

          {/* Configurações Avançadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Página Inicial (start_url)
              </label>
              <input
                type="text"
                className="input"
                defaultValue={get('pwa.startUrl', '/')}
                onChange={(e) => debouncedUpsert('pwa.startUrl', e.target.value, 'string')}
                placeholder="/"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exibição</label>
              <select
                className="input"
                defaultValue={get('pwa.display', 'standalone')}
                onChange={(e) => debouncedUpsert('pwa.display', e.target.value, 'string')}
              >
                <option value="standalone">Standalone (Recomendado)</option>
                <option value="fullscreen">Fullscreen</option>
                <option value="minimal-ui">Minimal UI</option>
                <option value="browser">Browser</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ativar Modo Offline</label>
                <p className="text-xs text-gray-500">Habilita cache e permite uso básico sem internet</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const current = get('pwa.offlineEnabled', true);
                  debouncedUpsert('pwa.offlineEnabled', !current, 'boolean');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  get('pwa.offlineEnabled', true) ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {get('pwa.offlineEnabled', true) ? (
                  <>
                    <ToggleRight className="w-5 h-5" />
                    <span>Ativado</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5" />
                    <span>Desativado</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Atualização Automática do App</label>
                <p className="text-xs text-gray-500">Service Worker atualiza automaticamente quando há novas versões</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const current = get('pwa.autoUpdate', true);
                  debouncedUpsert('pwa.autoUpdate', !current, 'boolean');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  get('pwa.autoUpdate', true) ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {get('pwa.autoUpdate', true) ? (
                  <>
                    <ToggleRight className="w-5 h-5" />
                    <span>Ativado</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5" />
                    <span>Desativado</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Dica:</strong> Após salvar as configurações, o manifest.json e service-worker.js serão atualizados automaticamente.
              Os usuários precisarão recarregar a página para ver as mudanças.
            </p>
          </div>
        </div>
      </div>

      {/* Webhooks (Avançado) */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Gateway de Pagamento (Webhooks)</h2>
          <button className="ml-auto text-sm text-primary-700" onClick={() => setShowAdvanced((v) => !v)}>
            {showAdvanced ? 'Ocultar avançado' : 'Mostrar avançado'}
          </button>
        </div>
        {showAdvanced && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant ID</label>
                <input className="input" defaultValue={tenantId} onChange={(e) => debouncedUpsert('tenant.id', e.target.value, 'string')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Token Secreto</label>
                <input className="input" defaultValue={webhookSecret} onChange={(e) => debouncedUpsert('webhook.secret', e.target.value, 'string')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                <input className="input" value={webhookUrl} readOnly />
              </div>
            </div>
            <div className="mt-4">
              <button className="btn btn-primary" onClick={createWebhook}><Plus className="w-4 h-4 mr-2" /> Criar/Atualizar Webhook</button>
            </div>

            {/* Lista de webhooks */}
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="p-2">Tenant</th>
                    <th className="p-2">URL</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {webhooks.map((w) => (
                    <tr key={w.id} className="border-t">
                      <td className="p-2"><input className="input" defaultValue={w.tenantId} onBlur={(e) => saveWebhook({ ...w, tenantId: e.target.value })} /></td>
                      <td className="p-2"><input className="input" defaultValue={w.webhookUrl} onBlur={(e) => saveWebhook({ ...w, webhookUrl: e.target.value })} /></td>
                      <td className="p-2">
                        <select className="input" defaultValue={w.status} onChange={(e) => saveWebhook({ ...w, status: e.target.value })}>
                          <option value="active">ativo</option>
                          <option value="inactive">inativo</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <button className="btn btn-danger" onClick={() => deleteWebhook(w.id)}><Trash2 className="w-4 h-4 mr-1" /> Remover</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Logs */}
            <div className="mt-8">
              <div className="flex items-end gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar Tenant</label>
                  <input className="input" placeholder="client_001" onChange={(e) => setFilters((f) => ({ ...f, tenantId: e.target.value || undefined }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo do evento</label>
                  <input className="input" placeholder="payment.updated" onChange={(e) => setFilters((f) => ({ ...f, eventType: e.target.value || undefined }))} />
                </div>
                <button className="btn btn-secondary" onClick={loadLogs}><RefreshCw className="w-4 h-4 mr-1" /> Atualizar</button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="p-2">Data</th>
                      <th className="p-2">Evento</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.id} className="border-t">
                        <td className="p-2">{new Date(l.createdAt).toLocaleString()}</td>
                        <td className="p-2">{l.eventType}</td>
                        <td className="p-2">{l.responseStatus}</td>
                        <td className="p-2">
                          <button className="btn btn-secondary" onClick={() => resendLog(l.id)}><RotateCcw className="w-4 h-4 mr-1" /> Reenviar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Outras configurações */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Front-end e CORS</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frontend URL</label>
            <input className="input" defaultValue={get('frontend.url', 'http://localhost:3005')} onChange={(e) => debouncedUpsert('frontend.url', e.target.value, 'string')} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">CORS: Allowed Origins (JSON)</label>
            <input className="input" defaultValue={JSON.stringify(get('frontend.allowedOrigins', []))} onBlur={(e) => {
              try { debouncedUpsert('frontend.allowedOrigins', JSON.parse(e.target.value), 'json'); }
              catch { toast.error('JSON inválido'); }
            }} />
          </div>
        </div>
      </div>

      {/* Integração n8n (outgoing) */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">n8n - Webhook de Entrada (SaaS → n8n)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">n8n Incoming URL</label>
            <input className="input" defaultValue={n8nUrl} onChange={(e) => debouncedUpsert('n8n.incomingUrl', e.target.value, 'string')} placeholder="http://localhost:5678/webhook/XYZ" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">n8n Secret</label>
            <input className="input" defaultValue={n8nSecret} onChange={(e) => debouncedUpsert('n8n.secret', e.target.value, 'string')} />
          </div>
        </div>
        <div className="mt-4">
          <button
            className="btn btn-secondary"
            onClick={async () => {
              try {
                const { data } = await api.post('/admin/webhooks/test-outgoing', { url: n8nUrl, secret: n8nSecret });
                if (data?.skipped) {
                  if (data.reason === 'missing_url') return toast.error('Defina a n8n Incoming URL');
                  if (data.reason === 'missing_secret') return toast.error('Defina o n8n Secret');
                }
                if (data?.status) return toast.success(`Ping enviado (HTTP ${data.status})`);
                toast.success('Ping enviado');
              } catch (e: any) {
                toast.error(e?.response?.data?.error || e?.message || 'Falha ao enviar ping');
              }
            }}
          >
            Enviar teste para n8n
          </button>
        </div>
      </div>
    </div>
  );
}
