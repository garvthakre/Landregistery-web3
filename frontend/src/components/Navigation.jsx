import { Upload, CheckCircle, Users } from 'lucide-react';

function Navigation({ currentPage, setCurrentPage }) {
  const tabs = [
    { id: 'upload', label: 'Upload Document', icon: Upload },
    { id: 'verify', label: 'Verify Document', icon: CheckCircle },
    { id: 'transfer', label: 'Transfer Ownership', icon: Users }
  ];

  return (
    <nav className="bg-white shadow-sm mt-4 mx-4 rounded-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentPage(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition ${
                  currentPage === tab.id
                    ? 'text-green-700 border-b-4 border-green-600 bg-green-50'
                    : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
