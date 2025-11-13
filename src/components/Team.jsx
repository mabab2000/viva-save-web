import React, { useState } from 'react';

const Team = () => {
  // base list of members, we'll duplicate when expanding to simulate more members
  const baseMembers = [
    { id: 1, name: "BIZIYAREMYE ALPHONSE", role: "COORDINATOR", phone: "0783857284", whatsapp: "250783857284", image: "/ceo.png" },
    { id: 2, name: "DUSABIMANA JEAN CLAUDE", role: "EXECUTIVE SCRETARY", phone: "", whatsapp: "", image: "/es.png" },
    { id: 3, name: "BYIMANA JEAN DAMASCENE", role: "LOAN OFFICER", phone: "", whatsapp: "", image: "/loan.png" },
    { id: 4, name: "IRADUKUNDA DIANE", role: "GENERAL SECRETARY", phone: "", whatsapp: "", image: "/ssg.png" }
  ];

  // API members will be loaded when expanded; keep baseMembers for the main 4
  const teamMembers = baseMembers;
  const [apiMembers, setApiMembers] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [expanded, setExpanded] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // When expanded, show the base members immediately and append API members when they arrive
  const visibleMembers = expanded ? [...teamMembers, ...apiMembers] : teamMembers;

  // fetch members when expanded
  React.useEffect(() => {
    if (!expanded) return;
    let aborted = false;
    const controller = new AbortController();
    const fetchMembers = async () => {
      setApiLoading(true);
      setApiError(null);
      try {
        const res = await fetch('https://saving-api.mababa.app/api/members', { signal: controller.signal });
        if (!res.ok) {
          const errorText = await res.text().catch(() => 'Unknown error');
          throw new Error(`HTTP ${res.status} ${res.statusText}: ${errorText}`);
        }
        const body = await res.json();
        if (aborted) return;
        console.log('API members response:', body);
        // map api response to member shape
        const mapped = (body || []).map(m => ({
          id: m.id,
          name: m.username,
          role: 'Member',
          bio: '',
          email: m.email,
          phone: m.phone_number,
          whatsapp: m.phone_number, // use phone for WhatsApp if no separate field
          shares: m.shares, // include shares from API
          image: m.image_preview_link || '/logo.png',
          linkedin: '#',
          twitter: '#'
        }));
        console.log('Mapped members:', mapped);
        setApiMembers(mapped);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Failed to fetch members:', err);
        setApiError(err.message || 'Failed to load members');
        setApiMembers([]);
      } finally {
        if (!aborted) setApiLoading(false);
      }
    };
    fetchMembers();
    return () => { aborted = true; controller.abort(); };
  }, [expanded]);

  return (
    <section id="team" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Meet Our Team
          </h2>
         <p className="text-xl text-gray-600 max-w-3xl mx-auto text-justify">
  Our dedicated group is focused on helping members save and collaborate on 
  financial solutions. By sharing insights, resources, and opportunities, 
  we empower each other to find practical ways to achieve financial goals, 
  ensuring that every member can contribute and benefit from our collective expertise.
</p>

        </div>

        {/* Team Grid */}
        <div className="relative">
          {expanded && apiLoading && (
            <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
              <div className="text-center">
                <svg className="animate-spin mx-auto h-8 w-8 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <div className="mt-2 text-gray-700">Loading members…</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {visibleMembers.map((member) => (
            <div 
              key={member.id} 
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
            >
              {/* Profile Image */}
              <div className="relative overflow-hidden">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-blue-600 font-semibold mb-3">
                  {member.role}
                </p>
                <div className="mt-2 mb-4 flex items-center space-x-4">
                  {/* Phone icon (tel) */}
                  {member.phone ? (
                    <a href={`tel:${member.phone}`} className="text-gray-600 hover:text-blue-600" aria-label={`${member.name} phone`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.2 3.6a1 1 0 01-.217.98l-1.5 1.5a11.042 11.042 0 005.516 5.516l1.5-1.5a1 1 0 01.98-.217l3.6 1.2a1 1 0 01.684.949V19a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                      </svg>
                    </a>
                  ) : (
                    <span className="text-gray-300" aria-hidden>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.2 3.6a1 1 0 01-.217.98l-1.5 1.5a11.042 11.042 0 005.516 5.516l1.5-1.5a1 1 0 01.98-.217l3.6 1.2a1 1 0 01.684.949V19a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" /></svg>
                    </span>
                  )}

                  {/* WhatsApp icon (wa.me) - prefer member.whatsapp, fallback to phone (digits only) */}
                  {(() => {
                    const waNumRaw = member.whatsapp || member.phone || '';
                    const waNum = waNumRaw ? waNumRaw.toString().replace(/\D/g, '').replace(/^0+/, '') : '';
                    if (waNum) {
                      return (
                        <a href={`https://wa.me/${waNum}`} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-700" aria-label={`${member.name} whatsapp`}>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.52 3.48A11.92 11.92 0 0012 0C5.373 0 .01 5.373 0 12c0 2.11.55 4.18 1.59 6.02L0 24l6.2-1.63A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 22.1c-1.75 0-3.46-.46-4.95-1.33l-.35-.21-3.68.97.98-3.59-.23-.37A9.13 9.13 0 012.9 12c0-5.02 4.08-9.1 9.1-9.1S21.1 6.98 21.1 12 17.02 21.1 12 21.1z" />
                            <path d="M17.55 14.35c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.14-.67.15-.2.3-.78.97-.95 1.17-.17.2-.34.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.46 0 1.46 1.05 2.87 1.2 3.07.15.2 2.06 3.32 5 4.66 2.93 1.34 2.93.9 3.46.84.53-.07 1.77-.72 2.02-1.41.25-.69.25-1.28.18-1.41-.07-.13-.27-.2-.57-.35z" fill="#fff"/>
                          </svg>
                        </a>
                      );
                    }
                    return (
                      <span className="text-gray-300" aria-hidden>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.92 11.92 0 0012 0C5.373 0 .01 5.373 0 12c0 2.11.55 4.18 1.59 6.02L0 24l6.2-1.63A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 22.1c-1.75 0-3.46-.46-4.95-1.33l-.35-.21-3.68.97.98-3.59-.23-.37A9.13 9.13 0 012.9 12c0-5.02 4.08-9.1 9.1-9.1S21.1 6.98 21.1 12 17.02 21.1 12 21.1z"/></svg>
                      </span>
                    );
                  })()}
                </div>
                <div className="mt-4 flex space-x-2">
                  <button onClick={() => setSelectedMember(member)} className="px-3 py-2 bg-blue-100 hover:bg-gray-200 rounded text-sm">View member</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View all / collapse */}
        <div className="text-center mt-8">
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              disabled={apiLoading}
              className={`inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-colors ${apiLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {apiLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                'View all members'
              )}
            </button>
          ) : (
            <button onClick={() => setExpanded(false)} className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded">
              Collapse
            </button>
          )}
        </div>

        {/* API error */}
        {expanded && apiError && (
          <div className="max-w-3xl mx-auto mt-4 text-center text-red-600">
            Failed to load members: {apiError}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Join Thousands of Happy Savers?
            </h3>
            <p className="text-gray-600 mb-6">
              Our team is here to support you every step of the way on your savings journey.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-300">
              Get Started Today
            </button>
          </div>
          </div>

          {/* When expanded but API returned zero members and there is no error, show helpful message */}
          {expanded && !apiLoading && apiMembers.length === 0 && !apiError && (
            <div className="mt-6 text-center text-gray-600">
              No additional members found.
            </div>
          )}
        </div>
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-start space-x-4">
              <img src={selectedMember.image} alt={selectedMember.name} className="w-20 h-20 object-cover rounded" />
              <div>
                <h3 className="text-lg font-bold">{selectedMember.name}</h3>
                <div className="text-sm text-blue-600 mb-2">{selectedMember.role}</div>
                <p className="text-gray-700 text-sm mb-3">{selectedMember.bio}</p>
                <div className="flex flex-col space-y-1 text-sm">
                  {selectedMember.email && (
                    <a href={`mailto:${selectedMember.email}`} className="text-gray-700 hover:text-blue-600">{selectedMember.email}</a>
                  )}
                  {selectedMember.phone && (
                    <a href={`tel:${selectedMember.phone}`} className="text-gray-700 hover:text-blue-600">{selectedMember.phone}</a>
                  )}
                  {selectedMember.shares !== undefined && (
                    <div className="text-gray-700">
                      <span className="font-medium">Shares:</span> {selectedMember.shares}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setSelectedMember(null)} className="px-4 py-2 border rounded">Close</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </section>
  );
};

export default Team;