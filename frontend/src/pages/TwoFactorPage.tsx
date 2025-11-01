import React, { useState, useEffect } from 'react';
import { Shield, QrCode, Key, Smartphone, Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import OptimizedImage from '@/components/OptimizedImage';

export default function TwoFactorPage() {
  const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'backup'>('status');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [manualKey, setManualKey] = useState('');

  const queryClient = useQueryClient();

  // Buscar status do 2FA
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['two-factor-status'],
    queryFn: async () => {
      const { data } = await api.get('/two-factor/status');
      return data.data;
    }
  });

  // Gerar secret e QR code
  const generateSecretMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/two-factor/generate-secret');
      return data.data;
    },
    onSuccess: (data) => {
      setQrCodeUrl(data.qrCodeUrl);
      setManualKey(data.manualEntryKey);
      setBackupCodes(data.backupCodes);
      setStep('verify');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao gerar configuração 2FA');
    }
  });

  // Habilitar 2FA
  const enableMutation = useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post('/two-factor/enable', { token });
      return data.data;
    },
    onSuccess: () => {
      toast.success('2FA habilitado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['two-factor-status'] });
      setStep('backup');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Token inválido');
    }
  });

  // Desabilitar 2FA
  const disableMutation = useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post('/two-factor/disable', { token });
      return data.data;
    },
    onSuccess: () => {
      toast.success('2FA desabilitado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['two-factor-status'] });
      setStep('status');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Token inválido');
    }
  });

  // Regenerar códigos de backup
  const regenerateBackupMutation = useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post('/two-factor/regenerate-backup-codes', { token });
      return data.data;
    },
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      toast.success('Códigos de backup regenerados!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao regenerar códigos');
    }
  });

  const handleEnable = () => {
    if (!token.trim()) {
      toast.error('Digite o código do seu aplicativo');
      return;
    }
    enableMutation.mutate(token);
  };

  const handleDisable = () => {
    if (!token.trim()) {
      toast.error('Digite o código do seu aplicativo');
      return;
    }
    if (window.confirm('Tem certeza que deseja desabilitar o 2FA? Isso tornará sua conta menos segura.')) {
      disableMutation.mutate(token);
    }
  };

  const handleRegenerateBackup = () => {
    if (!token.trim()) {
      toast.error('Digite o código do seu aplicativo');
      return;
    }
    regenerateBackupMutation.mutate(token);
  };

  const downloadBackupCodes = () => {
    const rep = backupCodes.join('\n');
    const blob = new Blob([`Códigos de Backup 2FA - Sistema Embarcações\n\n${rep}\n\nGuarde estes códigos em local seguro!\n\n`], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes-2fa.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (statusLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="card">
        <div className="card-body">
          <div className="flex items-center mb-6">
            <Shield className="w-8 h-8 text-primary mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Autenticação de Dois Fatores (2FA)</h1>
              <p className="text-gray-600">Proteja sua conta com uma camada extra de segurança</p>
            </div>
          </div>

          {step === 'status' && (
            <div className="space-y-6">
              <div className={`alert ${status?.enabled ? 'alert-success' : 'alert-info'}`}>
                <Shield className="w-6 h-6" />
                <div>
                  <h3 className="font-bold">
                    {status?.enabled ? '2FA Habilitado' : '2FA Desabilitado'}
                  </h3>
                  <p>
                    {status?.enabled 
                      ? 'Sua conta está protegida com autenticação de dois fatores.'
                      : 'Habilite o 2FA para proteger sua conta com uma camada extra de segurança.'
                    }
                  </p>
                </div>
              </div>

              {status?.enabled && (
                <div className="stats shadow">
                  <div className="stat">
                    <div className="stat-title">Códigos de Backup</div>
                    <div className="stat-value text-primary">{status.backupCodesCount}</div>
                    <div className="stat-desc">códigos disponíveis</div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {!status?.enabled ? (
                  <button
                    onClick={() => generateSecretMutation.mutate()}
                    disabled={generateSecretMutation.isPending}
                    className="btn btn-primary"
                  >
                    {generateSecretMutation.isPending ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4 mr-2" />
                        Configurar 2FA
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setStep('backup')}
                      className="btn btn-outline"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Ver Códigos de Backup
                    </button>
                    <button
                      onClick={() => setStep('verify')}
                      className="btn btn-error btn-outline"
                    >
                      Desabilitar 2FA
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {step === 'setup' && (
            <div className="space-y-6">
              <div className="alert alert-info">
                <QrCode className="w-6 h-6" />
                <div>
                  <h3 className="font-bold">Configuração do 2FA</h3>
                  <p>Escaneie o QR code com seu aplicativo autenticador</p>
                </div>
              </div>

              <div className="text-center">
                {qrCodeUrl && (
                  <div className="mb-4">
                    <OptimizedImage
                      src={qrCodeUrl}
                      alt="QR Code para 2FA"
                      className="mx-auto border rounded-lg"
                      loading="eager"
                      objectFit="contain"
                    />
                  </div>
                )}
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Chave Manual (se não conseguir escanear):</span>
                  </label>
                  <input
                    type="text"
                    value={manualKey}
                    readOnly
                    className="input input-bordered font-mono text-sm"
                    onClick={(e) => e.currentTarget.select()}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('verify')}
                  className="btn btn-primary"
                >
                  Continuar
                </button>
                <button
                  onClick={() => setStep('status')}
                  className="btn btn-ghost"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6">
              <div className="alert alert-warning">
                <Smartphone className="w-6 h-6" />
                <div>
                  <h3 className="font-bold">Verificação</h3>
                  <p>Digite o código de 6 dígitos do seu aplicativo autenticador</p>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Código 2FA:</span>
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="input input-bordered text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={8}
                />
              </div>

              <div className="flex gap-3">
                {!status?.enabled ? (
                  <button
                    onClick={handleEnable}
                    disabled={enableMutation.isPending}
                    className="btn btn-primary"
                  >
                    {enableMutation.isPending ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      'Habilitar 2FA'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleDisable}
                    disabled={disableMutation.isPending}
                    className="btn btn-error"
                  >
                    {disableMutation.isPending ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      'Desabilitar 2FA'
                    )}
                  </button>
                )}
                <button
                  onClick={() => setStep('status')}
                  className="btn btn-ghost"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {step === 'backup' && (
            <div className="space-y-6">
              <div className="alert alert-warning">
                <Key className="w-6 h-6" />
                <div>
                  <h3 className="font-bold">Códigos de Backup</h3>
                  <p>Guarde estes códigos em local seguro. Use-os caso perca acesso ao seu aplicativo autenticador.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="p-3 bg-gray-100 rounded text-center">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={downloadBackupCodes}
                  className="btn btn-outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Códigos
                </button>
                <button
                  onClick={() => setStep('verify')}
                  className="btn btn-outline"
                >
                  Regenerar Códigos
                </button>
                <button
                  onClick={() => setStep('status')}
                  className="btn btn-primary"
                >
                  Concluir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

