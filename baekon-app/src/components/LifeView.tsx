"use client";

import { useState, useEffect } from "react";

interface Note {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags: string[];
  section: 'WORK' | 'LIFE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  archived: boolean;
  aiGenerated: boolean;
  aiSummary?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface LifeViewProps {
  userId: string;
}

export default function LifeView({ userId }: LifeViewProps) {
  const [lifeNotes, setLifeNotes] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ [key: string]: Note[] }>({});

  // Fetch life notes
  useEffect(() => {
    fetchNotes();
  }, [userId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notes?userId=${userId}&section=LIFE`);
      if (response.ok) {
        const fetchedNotes = await response.json();
        setNotes(fetchedNotes);
        
        // Group notes by category
        const grouped = fetchedNotes.reduce((acc: { [key: string]: Note[] }, note: Note) => {
          const category = note.category || 'Uncategorized';
          if (!acc[category]) acc[category] = [];
          acc[category].push(note);
          return acc;
        }, {});
        setCategories(grouped);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!lifeNotes.trim()) return;

    try {
      setLoading(true);
      
      // First, organize the note with AI
      const organizeResponse = await fetch('/api/notes/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: lifeNotes,
          section: 'LIFE',
          userId
        })
      });

      let noteData = {
        title: lifeNotes.substring(0, 50),
        content: lifeNotes,
        category: 'general',
        tags: [],
        section: 'LIFE',
        priority: 'MEDIUM',
        userId
      };

      if (organizeResponse.ok) {
        const organized = await organizeResponse.json();
        noteData = { ...noteData, ...organized };
      }

      // Create the note
      const createResponse = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });

      if (createResponse.ok) {
        setLifeNotes("");
        fetchNotes(); // Refresh the notes list
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full p-6 flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neon-purple neon-text mb-2">Life</h2>
        <p className="text-gray-400 text-sm">Personal notes and life organization</p>
      </div>

      {/* Note Input */}
      <div className="mb-6">
        <textarea
          value={lifeNotes}
          onChange={(e) => setLifeNotes(e.target.value)}
          placeholder="Enter your personal notes... BÆKON will organize them for you."
          disabled={loading}
          className="w-full h-32 bg-gray-900/50 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-neon-purple focus:shadow-neon-purple transition-all duration-200"
        />
        <button
          onClick={handleAddNote}
          disabled={loading || !lifeNotes.trim()}
          className="mt-2 px-4 py-2 bg-neon-purple/20 border border-neon-purple text-neon-purple rounded-lg hover:bg-neon-purple/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Add Note'}
        </button>
      </div>

      {/* Notes Categories */}
      <div className="flex-1 overflow-y-auto">
        {loading && notes.length === 0 ? (
          <div className="text-gray-400 text-center">Loading notes...</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(categories).map(([categoryName, categoryNotes]) => (
              <div key={categoryName}>
                <h3 className="text-lg font-semibold text-neon-aqua mb-3 capitalize">
                  {categoryName}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {categoryNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 hover:border-neon-purple/50 transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-white">{note.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          note.priority === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                          note.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {note.priority}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{note.content}</p>
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs bg-gray-700/50 text-gray-400 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}