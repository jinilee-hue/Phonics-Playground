import { useT } from '../i18n'

/** 페이지 공통 하단 푸터 — AI 생성 안내 + 카피라이트 */
export function AppFooter() {
  const t = useT()
  return (
    <footer className="app-footer">
      <p className="app-footer-notice">{t('footer.aiNotice')}</p>
      <p className="app-footer-copy">{t('footer.copyright')}</p>
    </footer>
  )
}
