const PrintModal = ({ isOpen, onClose, onPrint, viewMode, currentDate }) => {
  const [step, setStep] = useState('mode'); // 'mode', 'dates', 'programs'
  const [selectedDates, setSelectedDates] = useState([]);
  const [viewDate, setViewDate] = useState(new Date());
  
  const [fetchedData, setFetchedData] = useState({ programs: {}, inCharge: {}, sortedDates: [] });
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingModal, setIsExportingModal] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setStep('mode');
      setSelectedDates([]);
      setViewDate(currentDate || new Date());
      setFetchedData({ programs: {}, inCharge: {}, sortedDates: [] });
      setSelectedIds([]);
      setIsLoading(false);
      setIsExportingModal(false);
    }
  }, [isOpen, currentDate]);

  const handleSelectMode = (mode) => {
    if (mode === 'current') {
      const dStr = getLocalDateString(currentDate);
      setSelectedDates([dStr]);
      fetchDataForDates([dStr]);
    } else {
      setStep('dates');
    }
  };

  const toggleDate = (dateObj) => {
    const dStr = getLocalDateString(dateObj);
    setSelectedDates(prev => prev.includes(dStr) ? prev.filter(d => d !== dStr) : [...prev, dStr]);
  };

  const handleProceedDates = () => {
    if (selectedDates.length === 0) return;
    fetchDataForDates(selectedDates);
  };

  const fetchDataForDates = async (dates) => {
    setStep('programs');
    setIsLoading(true);
    try {
      const programsByDate = {};
      const inChargeByDate = {};
      const allSelectedIds = [];

      await Promise.all(dates.map(async (dStr) => {
        const q = query(collection(db, 'programs'), where('date', '==', dStr));
        const pSnap = await getDocs(q);
        const progs = pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const relevant = progs.filter(p => {
          if (viewMode === 'schedule') return !p.type || p.type === 'schedule';
          return p.type === 'todo';
        }).sort((a, b) => {
          if (!a.time && !b.time) return (a.createdAt || 0) - (b.createdAt || 0);
          if (!a.time) return -1;
          if (!b.time) return 1;
          return (a.time || '').localeCompare(b.time || '');
        });
        
        programsByDate[dStr] = relevant;
        allSelectedIds.push(...relevant.map(p => p.id));

        const icSnap = await getDoc(doc(db, 'in_charge', dStr));
        if (icSnap.exists()) {
          inChargeByDate[dStr] = icSnap.data();
        } else {
          inChargeByDate[dStr] = {
            pa: { type: 'Adv Hisham', name: 'Adv Hisham', phone: '9744660071' },
            gunman: { type: 'Yasar', name: 'Yasar', phone: '9947700895' }
          };
        }
      }));

      const sortedDates = [...dates].sort();
      setFetchedData({ programs: programsByDate, inCharge: inChargeByDate, sortedDates });
      setSelectedIds(allSelectedIds);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handlePrint = () => {
    setIsExportingModal(true);
    const filteredProgramsByDate = {};
    fetchedData.sortedDates.forEach(dStr => {
      const filtered = fetchedData.programs[dStr].filter(p => selectedIds.includes(p.id));
      if (filtered.length > 0) {
        filteredProgramsByDate[dStr] = filtered;
      }
    });

    onPrint({ 
      groupedPrograms: filteredProgramsByDate, 
      inChargeByDate: fetchedData.inCharge,
      sortedDates: fetchedData.sortedDates.filter(d => filteredProgramsByDate[d] && filteredProgramsByDate[d].length > 0),
      viewMode 
    });
    setTimeout(() => onClose(), 1000);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({length: 42}, (_, i) => {
    if (i < firstDay || i >= firstDay + daysInMonth) return null;
    return new Date(year, month, i - firstDay + 1);
  });
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthsList = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Export ${viewMode === 'todo' ? 'To-Dos' : 'Schedule'}`}>
      {step === 'mode' && (
        <div className="space-y-4">
          <p className="text-center text-sm text-stone-600 mb-6">Which dates do you want to export?</p>
          <button onClick={() => handleSelectMode('current')} className="w-full py-4 bg-[#4a3b32] text-white rounded-xl font-bold hover:bg-[#3a2e26] transition-colors flex flex-col items-center shadow-md">
            <span>Current Date</span>
            <span className="text-xs font-normal opacity-80 mt-1">{getLocalDateString(currentDate || new Date())}</span>
          </button>
          <button onClick={() => handleSelectMode('custom')} className="w-full py-4 bg-white border-2 border-[#4a3b32] text-[#4a3b32] rounded-xl font-bold hover:bg-stone-50 transition-colors flex flex-col items-center">
            <span>Custom Dates</span>
            <span className="text-xs font-normal opacity-80 mt-1">Select multiple days</span>
          </button>
        </div>
      )}

      {step === 'dates' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-stone-100 rounded-lg p-1 mb-2">
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-stone-200 rounded-md transition-colors"><IconChevronLeft size={20} /></button>
            <div className="font-bold text-stone-800">{monthsList[month]} {year}</div>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-stone-200 rounded-md transition-colors"><IconChevronRight size={20} /></button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {weekDays.map(day => <div key={day} className="text-xs font-semibold text-stone-400 py-1">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {days.map((d, i) => {
              if (!d) return <div key={i} className="h-10" />;
              const dStr = getLocalDateString(d);
              const isSelected = selectedDates.includes(dStr);
              return (
                <button
                  key={i}
                  onClick={() => toggleDate(d)}
                  className={`h-10 relative w-full rounded-xl flex items-center justify-center text-sm font-medium transition-colors ${isSelected ? 'bg-[#4a3b32] text-white shadow-md' : 'text-stone-700 hover:bg-stone-100'}`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('mode')} className="flex-1 py-3 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-colors">Back</button>
            <button onClick={handleProceedDates} disabled={selectedDates.length === 0} className="flex-1 py-3 bg-[#4a3b32] text-white rounded-xl font-medium hover:bg-[#3a2e26] transition-colors disabled:opacity-50">Proceed ({selectedDates.length})</button>
          </div>
        </div>
      )}

      {step === 'programs' && (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between px-1">
            <label className="text-sm font-medium text-stone-700">Select entries to include:</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedIds(fetchedData.sortedDates.flatMap(d => fetchedData.programs[d].map(p => p.id)))}
                className="text-xs font-semibold text-[#4a3b32] hover:underline"
              >Select All</button>
              <span className="text-stone-300">|</span>
              <button 
                onClick={() => setSelectedIds([])}
                className="text-xs font-semibold text-stone-500 hover:text-stone-800 hover:underline"
              >Unselect All</button>
            </div>
          </div>

          <div className="max-h-[40vh] overflow-y-auto border border-stone-200 rounded-xl bg-stone-50/50 p-2 space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-stone-200 border-t-[#4a3b32] rounded-full animate-spin"></div></div>
            ) : fetchedData.sortedDates.length === 0 || fetchedData.sortedDates.every(d => fetchedData.programs[d].length === 0) ? (
              <p className="text-sm text-center text-stone-500 py-4">No entries found.</p>
            ) : (
              fetchedData.sortedDates.map(dStr => {
                const progs = fetchedData.programs[dStr];
                if (progs.length === 0) return null;
                
                return (
                  <div key={dStr} className="space-y-1">
                    <div className="sticky top-0 bg-stone-50/95 backdrop-blur-sm z-10 py-1.5 px-2 border-b border-stone-200 mb-1">
                      <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">{formatDate(new Date(dStr))}</span>
                    </div>
                    {progs.map(p => {
                      let displayTime = "All Day";
                      if (p.time && p.type !== 'todo') {
                        const [h, m] = p.time.split(':');
                        const hour = parseInt(h, 10);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        displayTime = `${hour % 12 || 12}:${m} ${ampm}`;
                      }

                      return (
                        <label key={p.id} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${selectedIds.includes(p.id) ? 'bg-white shadow-sm border border-stone-200' : 'hover:bg-stone-100 border border-transparent'}`}>
                          <div className="pt-0.5">
                            <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => handleToggle(p.id)} className="w-4 h-4 text-[#4a3b32] focus:ring-[#4a3b32] border-stone-300 rounded cursor-pointer" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${selectedIds.includes(p.id) ? 'text-stone-900' : 'text-stone-500'}`}>{p.eventName}</p>
                            {viewMode === 'schedule' && <p className={`text-xs mt-0.5 ${selectedIds.includes(p.id) ? 'text-stone-500' : 'text-stone-400'}`}>{displayTime}</p>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setStep('mode')} className="flex-1 py-3 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-colors">Back</button>
            <button onClick={handlePrint} disabled={isExportingModal || selectedIds.length === 0} className="flex-1 py-3 bg-[#4a3b32] text-white rounded-xl font-medium hover:bg-[#3a2e26] transition-colors flex justify-center items-center gap-2 disabled:opacity-50">
              {isExportingModal ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <IconPrinter size={18} />}
              {isExportingModal ? 'Generating...' : `Print (${selectedIds.length})`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
