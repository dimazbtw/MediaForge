import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { TOOLS } from '../components/Layout.jsx'
import { useI18n } from '../i18n/index.jsx'

export default function NotFound() {
  const { t } = useI18n()

  return (
    <div className="mf-stack py-16 text-center max-w-lg mx-auto">
      <p className="font-display text-[clamp(4rem,18vw,8rem)] font-extrabold tracking-tighter leading-none text-accent">
        404
      </p>
      <h1 className="font-display text-2xl font-extrabold tracking-tight mt-2">{t('notfound.title')}</h1>
      <p className="text-muted mt-3 leading-relaxed">{t('notfound.body')}</p>

      <div className="flex flex-wrap justify-center gap-2 mt-7">
        {TOOLS.map((tool) => (
          <Link
            key={tool.to}
            to={tool.to}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] border border-line-strong hover:border-accent hover:text-accent transition-colors text-sm font-medium"
          >
            <tool.icon size={15} />
            {t(tool.labelKey)}
          </Link>
        ))}
      </div>

      <Link
        to="/"
        className="inline-flex items-center gap-1.5 mt-8 text-[13px] text-muted hover:text-accent transition-colors"
      >
        <ArrowLeft size={14} />
        {t('common.back')}
      </Link>
    </div>
  )
}
