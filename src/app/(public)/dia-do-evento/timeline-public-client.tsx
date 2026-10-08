"use client";

import { Clock } from "lucide-react";
import { motion } from "framer-motion";

export function TimelinePublicClient({ events }: { events: any[] }) {
  if (events.length === 0) {
    return (
      <div className="text-center p-8 bg-linho rounded-2xl border border-linha w-full">
        <p className="text-tinta-suave">O cronograma ainda está sendo preparado pelos noivos.</p>
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
            <Clock className="w-4 h-4 text-sucesso" />
          </span>

          <div className="bg-papel border border-linha rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
              <span className="text-sucesso font-bold bg-sucesso-suave px-3 py-1 rounded-md text-sm inline-block w-fit">
                {event.time}
              </span>
              <h3 className="font-bold text-xl text-tinta">
                {event.title}
              </h3>
            </div>
            {event.description && (
              <p className="text-tinta-suave leading-relaxed">{event.description}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
