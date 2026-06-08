import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Award,
  ArrowRight,
  User,
  BookOpen,
  Calendar,
  Hash,
} from 'lucide-react';
import { verifyCertificate } from '@/utils/api';
import { cn } from '@/lib/utils';
import type { Certificate } from '../../shared/types.js';

export default function VerifyCertificate() {
  const navigate = useNavigate();
  const [certificateNumber, setCertificateNumber] = useState('');
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateNumber.trim()) return;

    setLoading(true);
    setVerified(null);
    setCertificate(null);
    setError(null);

    try {
      const result = await verifyCertificate(certificateNumber.trim());
      setVerified(result.valid);
      if (result.valid && result.certificate) {
        setCertificate(result.certificate);
      }
    } catch (err) {
      setError('验证失败，请稍后重试');
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-6">
          <Award className="w-10 h-10 text-blue-800" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">证书验证</h1>
        <p className="text-gray-500 text-lg">
          输入证书编号，验证证书的真实性
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <form onSubmit={handleVerify} className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              证书编号
            </label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="请输入证书编号"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all text-lg font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !certificateNumber.trim()}
            className="w-full py-4 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-lg"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Search className="w-6 h-6" />
                验证证书
              </>
            )}
          </button>
        </form>

        {verified === true && certificate && (
          <div className="animate-in fade-in duration-500">
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-teal-800 mb-1">
                    证书有效
                  </h3>
                  <p className="text-teal-600">
                    该证书是由在线学习平台颁发的真实有效证书
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <Award className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {certificate.course?.title || '课程'}
                  </h3>
                  <p className="text-gray-500">结业证书</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-800" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">学员姓名</div>
                    <div className="font-semibold text-gray-900">
                      {certificate.user?.name || '学员'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">课程名称</div>
                    <div className="font-semibold text-gray-900">
                      {certificate.course?.title || '课程'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">颁发日期</div>
                    <div className="font-semibold text-gray-900">
                      {formatDate(certificate.issuedAt)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Hash className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">证书编号</div>
                    <div className="font-mono font-semibold text-gray-900 break-all">
                      {certificate.certificateNumber}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/certificates/${certificate.certificateNumber}`)}
                className="w-full mt-6 py-3 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                查看完整证书
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {verified === false && (
          <div className="animate-in fade-in duration-500">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-800 mb-1">
                    证书无效
                  </h3>
                  <p className="text-red-600">
                    未找到该证书编号对应的证书，请检查证书编号是否正确，或该证书已被撤销。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="animate-in fade-in duration-500">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-800 mb-1">
                    验证出错
                  </h3>
                  <p className="text-amber-600">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-500">
          证书编号通常位于证书底部，格式如：{`CERT-XXXXXX`}
        </p>
      </div>
    </div>
  );
}
