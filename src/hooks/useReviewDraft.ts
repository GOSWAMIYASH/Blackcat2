import { useState, useEffect, useCallback, useRef } from 'react';
import { ReviewStatus } from '../types';

export interface ReviewDraft {
  notes: string;
  followUp: string;
  decision: ReviewStatus;
  savedAt: string;
}

export function useReviewDraft(
  findingId: string,
  initialDecision: ReviewStatus,
  initialNotes: string = '',
  initialFollowUp: string = ''
) {
  const storageKey = `satsa_review_draft_${findingId}`;

  // Read initial draft from localStorage if available
  const [draftRestored, setDraftRestored] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const getSavedDraft = (): ReviewDraft | null => {
    try {
      const item = localStorage.getItem(storageKey);
      if (item) {
        return JSON.parse(item) as ReviewDraft;
      }
    } catch (e) {
      console.warn(`Failed to parse draft for ${storageKey}:`, e);
    }
    return null;
  };

  const initialDraft = getSavedDraft();

  const [decision, setDecision] = useState<ReviewStatus>(() => {
    if (initialDraft && initialDraft.decision) {
      return initialDraft.decision;
    }
    return initialDecision;
  });

  const [notes, setNotes] = useState<string>(() => {
    if (initialDraft && typeof initialDraft.notes === 'string') {
      return initialDraft.notes;
    }
    return initialNotes;
  });

  const [followUp, setFollowUp] = useState<string>(() => {
    if (initialDraft && typeof initialDraft.followUp === 'string') {
      return initialDraft.followUp;
    }
    return initialFollowUp;
  });

  // Track if a draft was restored on mount
  useEffect(() => {
    if (initialDraft && (initialDraft.notes !== initialNotes || initialDraft.followUp !== initialFollowUp)) {
      setDraftRestored(true);
      setLastSaved(initialDraft.savedAt);
    }
  }, [storageKey]);

  // Save to localStorage as the user types
  const saveTimeoutRef = useRef<number | null>(null);

  const persistDraft = useCallback(
    (currentDecision: ReviewStatus, currentNotes: string, currentFollowUp: string) => {
      try {
        const timestamp = new Date().toISOString();
        const draft: ReviewDraft = {
          decision: currentDecision,
          notes: currentNotes,
          followUp: currentFollowUp,
          savedAt: timestamp
        };
        localStorage.setItem(storageKey, JSON.stringify(draft));
        setLastSaved(timestamp);
      } catch (e) {
        console.warn('Failed to save review draft to localStorage:', e);
      }
    },
    [storageKey]
  );

  useEffect(() => {
    // Debounce save slightly (250ms) to ensure smooth typing while providing instant durability
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      // Only save if there is content or non-default state
      if (notes.trim() || followUp.trim() || decision !== initialDecision) {
        persistDraft(decision, notes, followUp);
      }
    }, 250);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [decision, notes, followUp, persistDraft, initialDecision]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setDraftRestored(false);
      setLastSaved(null);
    } catch (e) {
      console.warn('Failed to clear draft from localStorage:', e);
    }
  }, [storageKey]);

  const discardDraft = useCallback(() => {
    clearDraft();
    setNotes(initialNotes);
    setFollowUp(initialFollowUp);
    setDecision(initialDecision);
  }, [clearDraft, initialNotes, initialFollowUp, initialDecision]);

  return {
    decision,
    setDecision,
    notes,
    setNotes,
    followUp,
    setFollowUp,
    draftRestored,
    lastSaved,
    clearDraft,
    discardDraft
  };
}
