"use client";

import { Clock } from "lucide-react";
import { motion } from "framer-motion";

export function TimelinePublicClient({ events }: { events: any[] }) {
  if (events.length === 0) {
    return (
      <div className="text-center p-8 bg-zinc-50 rounded-2xl border border-zinc-200 w-full">
        <p className="text-zinc-500">O cronograma ainda está sendo preparado pelos noivos.</p>
      </div>
    );
  }

  return (
    <div className="w-full relative pl-6 border-l-2 border-emerald-200 space-y-12 py-4">
      {events.map((event, i) => (
        <motion.div 
          key={event.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="relative pl-6"
        >
          {/* Timeline Dot */}
          <span className="absolute -left-[37px] top-1 w-8 h-8 rounded-full bg-emerald-100 border-4 border-white shadow-sm flex items-center justify-center z-10">
            <Clock className="w-4 h-4 text-emerald-600" />
          </span>

          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
              <span className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-md text-sm inline-block w-fit">
                {event.time}
              </span>
              <h3 className="font-bold text-xl text-zinc-900">
                {event.title}
              </h3>
            </div>
            {event.description && (
              <p className="text-zinc-600 leading-relaxed">{event.description}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
