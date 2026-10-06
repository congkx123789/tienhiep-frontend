import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useVipGate } from '../../../contexts/VipGateContext';
import { Crown, X } from 'lucide-react';
import { GateStep, GateTab } from './VipGate.types';
import { useAdReward } from './useAdReward';
import { useVipPayment } from './useVipPayment';
import { VipGateAdView } from './components/VipGateAdView';
import { VipGatePlansView } from './components/VipGatePlansView';
import { VipGatePaymentView } from './components/VipGatePaymentView';

export default function VipGateModal() {
  const { user, refreshUser } = useAuth();
  const { gateConfig, closeGate, unlockToolWithAd } = useVipGate();
  const { isOpen, toolId, toolName, description, durationMinutes = 30 } = gateConfig;

  const [step, setStep] = useState<GateStep>('plans');
  const [tab, setTab] = useState<GateTab>('vip');

  const {
    adWatching,
    adTimer,
    adFinished,
    handleStartAd,
    handleClaimReward,
    resetAd,
  } = useAdReward(toolId, durationMinutes, unlockToolWithAd, closeGate);

  const {
    selectedPlan,
    setSelectedPlan,
    loading,
    paymentData,
    setPaymentData,
    copyStatus,
    qrError,
    setQrError,
    countdown,
    startPolling,
    stopPolling,
    handleCopy,
    handleInitiatePayment,
  } = useVipPayment(user, refreshUser, toolId, unlockToolWithAd);

  useEffect(() => {
    if (isOpen) {
      setStep(toolId ? 'gate' : 'plans');
      setTab('vip');
      setSelectedPlan('month');
      setPaymentData(null);
      resetAd();
    }
    return () => stopPolling();
  }, [isOpen, toolId]);

  useEffect(() => {
    if (countdown.expired && step === 'payment') {
      stopPolling();
      setStep('plans');
    }
  }, [countdown.expired, step]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100005] flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && closeGate()}
    >
      <div className="relative w-full sm:max-w-lg bg-gradient-to-b from-[#0f0f1e] to-[#16162c] border border-amber-500/30 sm:rounded-3xl rounded-t-3xl shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col max-h-[88dvh]">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-[#0b0b14] font-black shadow-md shadow-amber-500/20">
              <Crown className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                {step === 'gate' ? 'Mở Khóa Tính Năng' : 'Ủng Hộ & Nâng Cấp VIP'}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {user?.vip_status === 1 ? 'ĐÃ LÀ VIP' : 'PRO ACCESS'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {step === 'gate' ? toolName : 'Mở khóa toàn bộ tool chuẩn & tắt mọi quảng cáo'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeGate}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {step === 'gate' && (
            <VipGateAdView
              toolName={toolName}
              description={description}
              durationMinutes={durationMinutes}
              adWatching={adWatching}
              adTimer={adTimer}
              adFinished={adFinished}
              onStartWatchAd={handleStartAd}
              onClaimAdReward={handleClaimReward}
              onGoToPlans={() => setStep('plans')}
            />
          )}

          {step === 'plans' && (
            <VipGatePlansView
              tab={tab}
              setTab={setTab}
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              loading={loading}
              toolId={toolId}
              onBackToGate={toolId ? () => setStep('gate') : undefined}
              onInitiatePayment={() => {
                handleInitiatePayment((createdData) => {
                  setStep('payment');
                  if (createdData?.order_id) {
                    startPolling(
                      createdData.order_id,
                      () => setStep('success'),
                      () => setStep('plans')
                    );
                  }
                });
              }}
            />
          )}

          {step === 'payment' && paymentData && (
            <VipGatePaymentView
              paymentData={paymentData}
              countdown={countdown}
              qrError={qrError}
              setQrError={setQrError}
              copyStatus={copyStatus}
              onCopy={handleCopy}
              onBackToPlans={() => {
                stopPolling();
                setStep('plans');
              }}
            />
          )}

          {step === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center mx-auto text-[#0b0b14] shadow-xl shadow-amber-500/30 animate-bounce">
                <Crown className="w-8 h-8 fill-current" />
              </div>
              <div>
                <h4 className="text-lg font-black text-amber-300">Chúc Mừng Bạn Đã Lên VIP!</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                  Toàn bộ các tool và tính năng độc quyền đã được mở khóa vĩnh viễn. Cảm ơn sự đồng hành và ủng hộ của bạn!
                </p>
              </div>
              <button
                type="button"
                onClick={closeGate}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-[#0b0b14] font-extrabold rounded-2xl text-xs shadow-lg shadow-amber-500/20"
              >
                Hoàn Tất & Bắt Đầu Trải Nghiệm
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export * from './VipGate.types';
