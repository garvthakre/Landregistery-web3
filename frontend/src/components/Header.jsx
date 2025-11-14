import { AlertCircle } from 'lucide-react';

function Header({ account, connectWallet }) {
  return (
    <header className="bg-white shadow-md border-b-4 border-green-600">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-green-800">
              🏛️ Tribal Land Registry
            </h1>
            <p className="text-sm text-gray-600">
              Udanti-Sitanadi Tiger Reserve Region, Chhattisgarh
            </p>
          </div>
          
          {!account ? (
            <button
              onClick={connectWallet}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg"
            >
              Connect MetaMask
            </button>
          ) : (
            <div className="bg-green-100 px-4 py-2 rounded-lg">
              <p className="text-xs text-gray-600">Connected</p>
              <p className="font-mono text-sm font-semibold text-green-800">
                {account.slice(0, 6)}...{account.slice(-4)}
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
