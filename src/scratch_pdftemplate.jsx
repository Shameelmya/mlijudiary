            {/* PDF EXPORT CONTENT - HIDDEN BEHIND APP */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-50] overflow-hidden">
          <div className="w-[640px] mx-auto bg-white text-black p-8 font-sans" id="pdf-export-content">
            {/* Main Header */}
            <div className="mb-6 flex flex-col items-center border-b border-stone-200 pb-6">
              <h1 className="text-3xl font-bold tracking-tight text-[#4a3b32] mb-1.5">KM Shaji</h1>
              <h2 className="text-base font-normal text-stone-600 mb-4">Hon. LSG Department Minister</h2>
              <h3 className="text-lg font-bold text-stone-900">
                {printConfig.viewMode === 'todo' ? 'To-Do List' : 'Programme Schedule'}
              </h3>
            </div>

            {/* Iterate over selected dates */}
            {printConfig.sortedDates && printConfig.sortedDates.map((dateStr, index) => {
              const inCharge = printConfig.inChargeByDate?.[dateStr];
              const progs = printConfig.groupedPrograms?.[dateStr] || [];
              if (progs.length === 0) return null;

              return (
                <div key={dateStr} className="mb-8" style={{ pageBreakInside: 'avoid' }}>
                  {/* Date Header */}
                  <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#292524', marginBottom: '12px', borderBottom: '2px solid #d6d3d1', paddingBottom: '4px' }}>
                    {formatDate(new Date(dateStr))}
                  </h4>

                  {/* PA and Gunman details */}
                  {printConfig.viewMode === 'schedule' && inCharge && (inCharge.pa?.name || inCharge.gunman?.name) && (
                    <div style={{ marginBottom: '16px', backgroundColor: '#fafaf9', padding: '12px', border: '1px solid #e7e5e4', borderRadius: '6px' }}>
                      {inCharge.pa?.name && (
                        <div style={{ fontSize: '13px', color: '#44403c', marginBottom: inCharge.gunman?.name ? '6px' : '0' }}>
                          <span style={{ fontWeight: 'bold', color: '#292524' }}>PA in Charge : </span>
                          <span>{inCharge.pa.name}</span>
                          {inCharge.pa.phone && (
                            <>
                              <span style={{ marginLeft: '12px' }}>Phone : </span>
                              <a href={`tel:${inCharge.pa.phone}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>{inCharge.pa.phone}</a>
                            </>
                          )}
                        </div>
                      )}
                      {inCharge.gunman?.name && (
                        <div style={{ fontSize: '13px', color: '#44403c' }}>
                          <span style={{ fontWeight: 'bold', color: '#292524' }}>Gun man in Charge : </span>
                          <span>{inCharge.gunman.name}</span>
                          {inCharge.gunman.phone && (
                            <>
                              <span style={{ marginLeft: '12px' }}>Phone : </span>
                              <a href={`tel:${inCharge.gunman.phone}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>{inCharge.gunman.phone}</a>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Table for this Date */}
                  <table className="w-full text-center border-separate border-spacing-0 bg-white border-t border-l border-stone-400">
                    <thead className="bg-[#4a3b32] text-white">
                      <tr>
                        {printConfig.viewMode === 'schedule' && (
                          <th className="pt-1.5 pb-3 px-3 font-bold text-[12px] tracking-wide border-b border-r border-stone-400 w-24 align-middle">Time</th>
                        )}
                        <th className="pt-1.5 pb-3 px-3 font-bold text-[12px] tracking-wide border-b border-r border-stone-400 align-middle">
                          {printConfig.viewMode === 'schedule' ? 'Programme' : 'Description'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {progs.map(p => {
                        let displayTime = "—";
                        if (p.time && p.type !== 'todo') {
                          const [h, m] = p.time.split(':');
                          const hour = parseInt(h, 10);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const displayHour = hour % 12 || 12;
                          displayTime = `${displayHour}:${m} ${ampm}`;
                        }

                        return (
                          <tr key={p.id} className="page-break-inside-avoid">
                            {printConfig.viewMode === 'schedule' && (
                              <td className="pt-2 pb-4 px-4 font-bold text-base text-black border-b border-r border-stone-400 align-middle text-left whitespace-nowrap">{displayTime}</td>
                            )}
                            <td className="pt-2 pb-4 px-4 align-middle text-left text-base border-b border-r border-stone-400 text-black">
                              {p.completed && (
                                <div className="mb-1.5">
                                  <span className="text-[9px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Completed</span>
                                </div>
                              )}
                              <div className={p.completed ? "line-through text-stone-400 whitespace-pre-wrap leading-snug" : "font-normal leading-snug whitespace-pre-wrap"}>
                                {p.eventName}
                                {p.coName && `\nC/o: ${p.coName}`}
                                {p.contactNumber && (
                                  <>
                                    <br />
                                    Mob: <a href={`tel:${p.contactNumber}`} className="text-blue-600 no-underline">{p.contactNumber}</a>
                                  </>
                                )}
                              </div>
                              {p.type === 'todo' && p.link && <div className="font-normal break-all mt-1">{p.link}</div>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}

            {/* Footer */}
            <div className="pt-4 border-t border-stone-200 flex justify-between items-center text-[10px] text-stone-400 uppercase tracking-widest mt-8">
              <span>Official Schedule Document</span>
              <span>Generated on {new Date().toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
