import React, { useState } from 'react';
import { 
  TruckIcon, BrainIcon, CheckCircleIcon, MapPinIcon, SearchIcon, 
  BellIcon, TrafficIcon, WeatherIcon 
} from './components/Icons';
import { DelayGauge } from './components/Charts';
import { 
  analyzeRouteImpact, 
  fetchLiveConditions
} from './services/geminiService';
import { Parcel, AIAnalysis, LiveConditions, Notification } from './types';

// Mock Data for Prototype (Indian Context)
const MOCK_PARCEL: Parcel = {
  id: "IN-8842-XJ",
  trackingNumber: "8842910392",
  recipient: "Ravi Kumar, Tech Solutions",
  origin: "Connaught Place, New Delhi",
  destination: "Koramangala, Bengaluru",
  status: "In Transit",
  estimatedDelivery: "Dec 21, 2024",
  currentLocation: "Nagpur, Maharashtra", // Central Hub
  history: [
    { timestamp: "Dec 19, 08:30 AM", location: "Nagpur Central Hub, MH", status: "Arrived at Facility", description: "Package arrived at central distribution center." },
    { timestamp: "Dec 18, 10:00 PM", location: "Bhopal Transit Center, MP", status: "Departed", description: "In transit to next facility." },
    { timestamp: "Dec 18, 02:15 PM", location: "Connaught Place, New Delhi", status: "Picked Up", description: "India Post picked up the package." },
  ]
};

export default function App() {
  const [trackingInput, setTrackingInput] = useState('');
  const [parcel, setParcel] = useState<Parcel | null>(null);
  
  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [liveInfo, setLiveInfo] = useState<{ data: LiveConditions, sources: any[] } | null>(null);
  const [thinkingOutput, setThinkingOutput] = useState<boolean>(false);
  
  // Notification System
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const addNotification = (title: string, message: string, type: 'alert' | 'info' | 'success') => {
      const newNote: Notification = {
          id: Date.now().toString(),
          title,
          message,
          type,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      setNotifications(prev => [newNote, ...prev]);
  };

  const handleTrack = async () => {
    if (!trackingInput) return;
    
    // Reset State
    setParcel(MOCK_PARCEL); 
    setIsAnalyzing(true);
    setThinkingOutput(true);
    setAnalysis(null);
    setLiveInfo(null);
    setNotifications([]); 

    try {
      const analysisPromise = analyzeRouteImpact(
        MOCK_PARCEL.origin,
        MOCK_PARCEL.destination,
        MOCK_PARCEL.currentLocation
      );

      const livePromise = fetchLiveConditions(MOCK_PARCEL.currentLocation);

      const [analysisResult, liveResult] = await Promise.all([
        analysisPromise,
        livePromise
      ]);

      setAnalysis(analysisResult);
      setLiveInfo({ 
        data: liveResult.data,
        sources: liveResult.sources
      });

      // Generate System Notifications based on AI analysis
      if (analysisResult) {
          if (analysisResult.delayProbability > 40) {
              addNotification(
                  "Delay Risk Detected", 
                  `High probability of delay (${analysisResult.delayProbability}%) detected near ${MOCK_PARCEL.currentLocation}.`, 
                  'alert'
              );
          } else {
               addNotification(
                  "On Track", 
                  "Shipment is moving as per schedule.", 
                  'success'
              );
          }
      }

      if (liveResult.data.alerts && liveResult.data.alerts.length > 0) {
          liveResult.data.alerts.forEach((alert: string) => {
               addNotification("Weather/Traffic Alert", alert, 'alert');
          });
      }

    } catch (error) {
      console.error("AI Error", error);
    } finally {
      setIsAnalyzing(false);
      setThinkingOutput(false);
    }
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-100 font-sans text-slate-800">
      {/* India Post Branding Navigation */}
      <nav className="bg-red-700 border-b border-red-800 sticky top-0 z-50 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-400 p-2 rounded shadow-sm">
                <TruckIcon className="h-8 w-8 text-red-700" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight text-white">India Post</span>
                <span className="text-xs text-yellow-300 font-bold tracking-widest uppercase">Smart Track</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
               <div className="relative">
                   <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 hover:bg-red-600 rounded-full transition relative"
                   >
                       <BellIcon className="w-6 h-6 text-white" />
                       {notifications.length > 0 && (
                           <span className="absolute top-1 right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-red-700"></span>
                       )}
                   </button>
                   
                   {/* Notification Dropdown */}
                   {showNotifications && (
                       <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden text-slate-900 z-50">
                           <div className="bg-slate-100 p-3 border-b border-slate-200 font-bold text-sm text-slate-700">Notifications</div>
                           <div className="max-h-64 overflow-y-auto">
                               {notifications.length === 0 ? (
                                   <div className="p-4 text-center text-slate-500 text-sm">No new notifications</div>
                               ) : (
                                   notifications.map(n => (
                                       <div key={n.id} className="p-3 border-b border-slate-100 hover:bg-slate-50">
                                           <div className="flex justify-between items-start mb-1">
                                               <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${n.type === 'alert' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                   {n.type === 'alert' ? 'Alert' : 'Info'}
                                               </span>
                                               <span className="text-xs text-slate-400">{n.time}</span>
                                           </div>
                                           <p className="font-bold text-sm text-slate-800">{n.title}</p>
                                           <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                                       </div>
                                   ))
                               )}
                           </div>
                       </div>
                   )}
               </div>
               <button className="hidden md:block text-red-100 hover:text-white font-bold text-sm">Business Login</button>
               <button className="bg-yellow-400 text-red-900 px-5 py-2 rounded font-bold hover:bg-yellow-300 transition shadow-md border border-yellow-500">
                 Ship Now
               </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!parcel ? (
          <div className="text-center py-24 animate-fade-in">
             <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
               Track your consignment
             </h1>
             <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto font-medium">
               Powered by advanced AI to predict delays across India's vast logistics network.
             </p>
             
             {/* Big Catchy Search Box */}
             <div className="max-w-2xl mx-auto relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-yellow-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-200"></div>
                <div className="relative bg-white rounded-2xl shadow-xl flex items-center p-2 border border-slate-200">
                    <div className="pl-4 pr-2 text-slate-400">
                        <SearchIcon className="w-8 h-8" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter Tracking ID (e.g. IN-8842...)"
                      className="flex-1 p-4 text-2xl outline-none text-slate-800 placeholder:text-slate-400 font-bold bg-transparent"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                    />
                    <button 
                      onClick={handleTrack}
                      className="bg-red-600 hover:bg-red-700 text-white text-xl font-bold px-10 py-4 rounded-xl transition-all shadow-md transform active:scale-95"
                    >
                      Track
                    </button>
                </div>
             </div>
             
             <div className="mt-8 flex justify-center gap-8 text-slate-500 font-medium text-sm">
                 <span className="flex items-center gap-1"><CheckCircleIcon className="w-5 h-5 text-green-500" /> AI Predictive Analysis</span>
                 <span className="flex items-center gap-1"><CheckCircleIcon className="w-5 h-5 text-green-500" /> Live Map Tracking</span>
                 <span className="flex items-center gap-1"><CheckCircleIcon className="w-5 h-5 text-green-500" /> Traffic & Weather Insights</span>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Shipment Info + Traffic/Weather */}
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-white rounded-xl shadow-md border-t-4 border-red-600 p-6">
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Consignment Number</p>
                      <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{parcel.trackingNumber}</h2>
                   </div>
                   <span className="bg-yellow-100 text-yellow-800 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider shadow-sm border border-yellow-200">
                     {parcel.status}
                   </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 font-semibold mb-1">Booked At</p>
                        <p className="font-bold text-slate-800">{parcel.origin}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 font-semibold mb-1">Destination</p>
                        <p className="font-bold text-slate-800">{parcel.destination}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                   <div className="text-sm font-bold text-red-800">Expected Delivery</div>
                   <div className="text-lg font-extrabold text-red-900">{parcel.estimatedDelivery}</div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                 <h3 className="font-bold text-slate-900 mb-6 text-lg">Tracking History</h3>
                 <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-2">
                    {parcel.history.map((event, idx) => (
                       <div key={idx} className="relative pl-8">
                          <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white shadow-sm ${idx === 0 ? 'bg-red-600 ring-2 ring-red-100' : 'bg-slate-300'}`}></div>
                          <div>
                             <p className="font-bold text-slate-800">{event.status}</p>
                             <p className="text-sm text-slate-600 mt-0.5 font-medium">{event.location}</p>
                             <p className="text-xs text-slate-400 mt-1 font-mono">{event.timestamp}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
              
              {/* Real-time Conditions Stacked */}
              <div className="grid grid-cols-1 gap-6">
                   {/* Traffic Animation Card */}
                   <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-lg transition-all h-40">
                       <div className="absolute inset-0 bg-gradient-to-b from-transparent to-orange-50 opacity-50"></div>
                       <div className="relative z-10 w-full">
                           <div className="flex items-center justify-center gap-2 mb-4 text-orange-600">
                               <TrafficIcon className="w-5 h-5" />
                               <h3 className="font-bold text-slate-900 text-sm">Traffic Status</h3>
                           </div>
                           
                           {/* Animation Container */}
                           <div className="h-10 w-full bg-slate-100 rounded-full flex items-center px-4 traffic-flow relative border border-slate-200 shadow-inner mb-3">
                                <div className="traffic-dot text-orange-500" style={{ animationDelay: '0s', left: '10%' }}></div>
                                <div className="traffic-dot text-orange-500" style={{ animationDelay: '0.5s', left: '10%' }}></div>
                                <div className="traffic-dot text-orange-600" style={{ animationDelay: '1.2s', left: '10%' }}></div>
                           </div>
                           
                           <div className="text-center">
                                <p className="font-bold text-slate-800 text-base">
                                    {liveInfo ? liveInfo.data.trafficStatus.split('.')[0] : 'Waiting...'}
                                </p>
                           </div>
                       </div>
                   </div>

                   {/* Weather Animation Card */}
                   <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-lg transition-all h-40">
                       <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50 opacity-50"></div>
                       <div className="relative z-10 w-full text-center">
                           <div className="flex items-center justify-center gap-2 mb-3 text-blue-500">
                               <WeatherIcon className="w-5 h-5" />
                               <h3 className="font-bold text-slate-900 text-sm">Weather Status</h3>
                           </div>
                           
                           <div className="flex justify-center my-2">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center weather-pulse text-blue-500">
                                    <div className="w-6 h-6 bg-blue-400 rounded-full shadow-lg"></div>
                                </div>
                           </div>
                           
                           <div className="text-center mt-2">
                                <p className="font-bold text-slate-800 text-base">
                                     {liveInfo ? liveInfo.data.weatherStatus.split('.')[0] : 'Waiting...'}
                                </p>
                           </div>
                       </div>
                   </div>
               </div>
            </div>

            {/* Right Column: Map, Action, Prediction */}
            <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
               
               {/* Map Context (Expanded) */}
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                  <MapPinIcon className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-slate-900">Live Map Tracking</h3>
                </div>
                <div className="w-full h-96 bg-slate-100 rounded-lg overflow-hidden relative">
                   <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        marginHeight={0} 
                        marginWidth={0} 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(parcel.currentLocation)}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
                        className="filter grayscale-[20%] hover:grayscale-0 transition-all duration-500"
                        title="Live Location"
                   ></iframe>
                </div>
                <p className="text-xs text-center text-slate-500 mt-3 font-medium">Real-time location based on last scan.</p>
              </div>

               {/* Action Banner */}
               {analysis && (
                 <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex items-center gap-5 shadow-sm">
                    <div className="bg-emerald-100 p-3 rounded-full flex-shrink-0">
                        <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                       <h4 className="font-bold text-emerald-900 text-sm uppercase tracking-wide mb-1">Suggested Action</h4>
                       <p className="text-emerald-900 text-lg font-bold">{analysis.recommendedAction}</p>
                    </div>
                 </div>
               )}

               {/* Spacer to push prediction to bottom */}
               <div className="flex-1"></div>

               {/* AI Prediction Card (Pinned Bottom) */}
               <div className="bg-slate-900 rounded-xl p-6 text-white shadow-xl overflow-hidden relative border border-slate-800 mt-auto">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                             <BrainIcon className={`w-6 h-6 ${thinkingOutput ? 'animate-pulse text-yellow-400' : 'text-slate-300'}`} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">Smart Delay Prediction</h2>
                          {thinkingOutput && <p className="text-xs text-slate-400 font-medium">Analyzing route patterns...</p>}
                        </div>
                     </div>
                     
                     {!analysis && isAnalyzing ? (
                        <div className="space-y-4 opacity-50 py-8">
                           <div className="h-4 bg-white/20 rounded w-3/4 animate-pulse"></div>
                           <div className="h-4 bg-white/20 rounded w-1/2 animate-pulse"></div>
                        </div>
                     ) : analysis ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                           <div className="space-y-4">
                              <div>
                                 <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Forecast</p>
                                 <p className="text-2xl font-bold text-white leading-tight">{analysis.prediction}</p>
                              </div>
                              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                 <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Analysis</p>
                                 <p className="text-sm text-slate-200 leading-relaxed font-medium">{analysis.reasoning}</p>
                              </div>
                           </div>
                           <div className="flex flex-col items-center justify-center bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                              <DelayGauge probability={analysis.delayProbability} />
                           </div>
                        </div>
                     ) : (
                        <div className="py-12 text-center text-slate-500 font-medium">
                            Waiting for tracking input...
                        </div>
                     )}
                  </div>
               </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}