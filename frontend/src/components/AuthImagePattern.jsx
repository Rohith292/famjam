const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center bg-base-200 p-12">
      <div className="max-w-md text-center">
        {/* Tree Pattern */}
        <div className="flex flex-col items-center gap-2 mb-8">
          {/* Tree Top */}
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-primary animate-pulse"></div>
          </div>
          
          {/* Middle Branches */}
          <div className="flex justify-center gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-primary/80"></div>
            ))}
          </div>

          {/* Lower Branches */}
          <div className="flex justify-center gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-primary/60"></div>
            ))}
          </div>

          {/* Even Lower Branches */}
          <div className="flex justify-center gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-5 h-5 rounded-full bg-primary/40"></div>
            ))}
          </div>

          {/* Tree Trunk */}
          <div className="w-6 h-16 rounded-lg bg-neutral"></div>
        </div>

        {/* Text Content */}
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-base-content/60">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;
