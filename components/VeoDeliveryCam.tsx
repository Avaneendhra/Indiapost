import React, { useState } from 'react';
import { generateDeliverySimulation } from '../services/geminiService';
import { VideoCameraIcon } from './Icons';

interface Props {
  address: string;
}

const VeoDeliveryCam: React.FC<Props> = ({ address }) => {
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setLoading(true);
    setVideoUrl(null);
    setStatusMsg('Initializing Veo simulation engine...');
    
    try {
        // We create a composite prompt to ensure it fits the hackathon theme
        const fullPrompt = `Cinematic drone shot following a delivery drone carrying a cardboard package. The drone flies through ${prompt}. The drone lands gently at ${address}. High quality, realistic lighting.`;
        
        setStatusMsg('Generating video frames (this may take a minute)...');
        const url = await generateDeliverySimulation(fullPrompt);
        setVideoUrl(url);
    } catch (e) {
        setStatusMsg('Failed to generate simulation. Please try again.');
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mt-6">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white flex items-center justify-between">
         <div className="flex items-center gap-2">
            <VideoCameraIcon className="w-5 h-5" />
            <h3 className="font-semibold">Veo Predictive Delivery Simulation</h3>
         </div>
         <span className="text-xs bg-white/20 px-2 py-1 rounded-full uppercase tracking-wider">Beta</span>
      </div>
      
      <div className="p-6">
        <p className="text-sm text-slate-500 mb-4">
          Visualize the delivery conditions for <strong>{address}</strong>. 
          Describe the environment (e.g., "snowy suburb", "busy city street at sunset") to generate a predictive video simulation.
        </p>

        <div className="flex gap-3 mb-4">
            <input 
                type="text" 
                className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder="e.g. A futuristic city in heavy rain..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />
            <button 
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
                {loading ? 'Generating...' : 'Simulate'}
            </button>
        </div>

        <div className="bg-slate-900 rounded-lg aspect-video flex items-center justify-center overflow-hidden relative">
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 text-white">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-sm font-mono animate-pulse">{statusMsg}</p>
                </div>
            )}
            
            {videoUrl ? (
                <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
            ) : (
                !loading && (
                    <div className="text-slate-500 text-center p-8">
                        <VideoCameraIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No simulation generated yet</p>
                    </div>
                )
            )}
        </div>
      </div>
    </div>
  );
};

export default VeoDeliveryCam;