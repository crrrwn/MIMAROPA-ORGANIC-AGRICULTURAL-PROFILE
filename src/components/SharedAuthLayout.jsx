export default function SharedAuthLayout({ children, title }) {
  return (
    <div className="min-h-screen flex font-poppins bg-gradient-to-br from-oa-green/20 via-oa-cream to-oa-blue/20">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/LOGO_OA.png" alt="OA Logo" className="h-20 w-20 mx-auto rounded-full object-cover shadow-lg" />
            <h1 className="text-2xl font-bold text-oa-green-dark mt-4">MIMAROPA Organic Profile</h1>
            <p className="text-oa-brown mt-2">{title}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
