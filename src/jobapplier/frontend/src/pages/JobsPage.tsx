import { useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowUpRight, Building2, MapPin } from 'lucide-react';
import type { Job } from '@/types';

export function JobsPage() {
  const { jobs } = useApp();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#0f0f0f] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Recommended Jobs</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              className="border-[#3a3a3a] text-gray-400 hover:text-white hover:border-[#f5c518]"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              className="border-[#3a3a3a] text-gray-400 hover:text-white hover:border-[#f5c518]"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Jobs Row 1 */}
        <div className="mb-8">
          <h2 className="text-sm text-gray-500 mb-4 uppercase tracking-wider">Based on your profile</h2>
          <div 
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {jobs.slice(0, 3).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>

        {/* Jobs Row 2 */}
        <div>
          <h2 className="text-sm text-gray-500 mb-4 uppercase tracking-wider">Trending now</h2>
          <div 
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {jobs.slice(3, 6).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Job Card Component
function JobCard({ job }: { job: Job }) {
  return (
    <div className="flex-shrink-0 w-[300px] bg-[#1a1a1a] rounded-lg p-5 border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-1 line-clamp-2 group-hover:text-[#f5c518] transition-colors">
            {job.title}
          </h3>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Building2 className="w-4 h-4" />
            <span>{job.company}</span>
          </div>
          {job.location && (
            <div className="flex items-center gap-2 text-gray-500 text-xs mt-1">
              <MapPin className="w-3 h-3" />
              <span>{job.location}</span>
            </div>
          )}
        </div>
      </div>

      {job.description && (
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
          {job.description}
        </p>
      )}

      {job.postedDate && (
        <p className="text-gray-600 text-xs mb-4">
          Posted {job.postedDate}
        </p>
      )}

      <a
        href={job.applicationUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Button
          className="w-full bg-[#f5c518] hover:bg-[#e6b800] text-black font-medium"
        >
          Apply
          <ArrowUpRight className="w-4 h-4 ml-2" />
        </Button>
      </a>
    </div>
  );
}
