import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Share2, CheckCircle, Award, ArrowLeft } from 'lucide-react';
import { verifyCertificate } from '@/utils/api';
import type { Certificate } from '../../shared/types.js';

export default function CertificatePage() {
  const { certificateNumber } = useParams<{ certificateNumber: string }>();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadCertificate();
  }, [certificateNumber]);

  const loadCertificate = async () => {
    if (!certificateNumber) return;
    setLoading(true);
    setError(null);
    try {
      const result = await verifyCertificate(certificateNumber);
      if (result.valid && result.certificate) {
        setCertificate(result.certificate);
      } else {
        setError('证书不存在或已失效');
      }
    } catch (err) {
      setError('加载证书失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleShare = async () => {
    if (!certificate) return;
    const shareUrl = `${window.location.origin}/certificates/${certificate.certificateNumber}`;
    const shareText = `我已成功完成《${certificate.course?.title || '课程'}》学习，获得结业证书！`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: '结业证书',
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerify = () => {
    navigate('/verify');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="w-8 h-8 text-blue-800 animate-spin" />
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <Award className="w-16 h-16 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-900">{error || '证书不存在'}</h2>
        <button
          onClick={() => navigate('/profile')}
          className="px-6 py-2 bg-blue-800 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          返回个人中心
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回个人中心</span>
      </button>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-teal-700 p-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-4">
            <Award className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold mb-2">结业证书</h1>
          <p className="text-white/80">Certificate of Completion</p>
        </div>

        <div className="relative p-12 bg-gradient-to-br from-amber-50 via-white to-blue-50">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e40af' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <div className="absolute top-4 left-4 w-24 h-24 border-t-4 border-l-4 border-amber-500 rounded-tl-3xl opacity-60" />
          <div className="absolute top-4 right-4 w-24 h-24 border-t-4 border-r-4 border-amber-500 rounded-tr-3xl opacity-60" />
          <div className="absolute bottom-4 left-4 w-24 h-24 border-b-4 border-l-4 border-amber-500 rounded-bl-3xl opacity-60" />
          <div className="absolute bottom-4 right-4 w-24 h-24 border-b-4 border-r-4 border-amber-500 rounded-br-3xl opacity-60" />

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
            <div className="text-[200px] font-bold text-blue-800 select-none">
              CERT
            </div>
          </div>

          <div className="relative text-center space-y-8 py-8">
            <p className="text-xl text-gray-600">
              兹证明
            </p>

            <h2 className="text-4xl font-bold text-gray-900">
              {certificate.user?.name || '学员'}
            </h2>

            <p className="text-lg text-gray-600">
              已成功完成
            </p>

            <h3 className="text-2xl font-bold text-blue-800">
              《{certificate.course?.title || '课程'}》
            </h3>

            <p className="text-lg text-gray-600">
              全部课程学习，成绩合格，特发此证。
            </p>

            <div className="pt-8 border-t border-gray-200 max-w-md mx-auto">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div>
                  <div className="mb-1">证书编号</div>
                  <div className="font-mono font-semibold text-gray-700">{certificate.certificateNumber}</div>
                </div>
                <div>
                  <div className="mb-1">颁发日期</div>
                  <div className="font-semibold text-gray-700">{formatDate(certificate.issuedAt)}</div>
                </div>
              </div>
            </div>

            <div className="pt-8 flex items-center justify-center gap-16">
              <div className="text-center">
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-blue-800 to-transparent mb-2" />
                <div className="text-sm text-gray-500">讲师签名</div>
                <div className="font-semibold text-gray-700 mt-1">
                  {certificate.course?.instructor?.name || '课程讲师'}
                </div>
              </div>
              <div className="w-20 h-20 rounded-full bg-amber-100 border-4 border-amber-500 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-amber-600" />
              </div>
              <div className="text-center">
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-teal-600 to-transparent mb-2" />
                <div className="text-sm text-gray-500">平台签章</div>
                <div className="font-semibold text-gray-700 mt-1">在线学习平台</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={handleVerify}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          <CheckCircle className="w-5 h-5" />
          验证证书
        </button>
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          {copied ? '已复制链接' : '分享证书'}
        </button>
      </div>
    </div>
  );
}
