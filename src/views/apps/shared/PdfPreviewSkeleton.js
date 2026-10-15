import Skeleton from '@components/skeleton'

// Shown in place of the Invoice/Quotation/Contract PDF preview iframe while
// the PDF is being generated client-side (@veztraa/report-renderer has no
// progress events to key a percentage off, just a resolved/unresolved
// promise) - loosely mimics a document page (letterhead, bill-to columns, a
// line items table, a totals block) instead of a bare "Generating preview…"
// line, so the panel doesn't look empty/broken while it works.
const PdfPreviewSkeleton = () => (
  <div className='p-2' style={{ height: '600px', overflow: 'hidden' }}>
    <div className='d-flex justify-content-between mb-2'>
      <Skeleton width={120} height={28} />
      <Skeleton width={90} height={20} />
    </div>
    <Skeleton width='70%' height={12} className='mb-50' />
    <Skeleton width='50%' height={12} className='mb-2' />

    <div className='d-flex justify-content-between mb-2' style={{ gap: '2rem' }}>
      <div style={{ flex: 1 }}>
        <Skeleton width={80} height={10} className='mb-50' />
        <Skeleton width='90%' height={12} className='mb-25' />
        <Skeleton width='70%' height={12} />
      </div>
      <div style={{ flex: 1 }}>
        <Skeleton width={80} height={10} className='mb-50' />
        <Skeleton width='60%' height={12} className='mb-25' />
        <Skeleton width='50%' height={12} />
      </div>
    </div>

    <Skeleton width='100%' height={28} className='mb-50' />
    {[0, 1, 2].map(i => (
      <div key={i} className='d-flex align-items-center py-50' style={{ gap: '1rem' }}>
        <Skeleton width='45%' height={12} />
        <Skeleton width='15%' height={12} />
        <Skeleton width='15%' height={12} />
        <Skeleton width='15%' height={12} />
      </div>
    ))}

    <div className='d-flex justify-content-end mt-2'>
      <div style={{ width: '35%' }}>
        <Skeleton width='100%' height={12} className='mb-50' />
        <Skeleton width='100%' height={12} className='mb-50' />
        <Skeleton width='100%' height={20} />
      </div>
    </div>
  </div>
)

export default PdfPreviewSkeleton
