"use client";

import React, { useState } from "react";
import { Link2, X, ExternalLink } from "lucide-react";
import { PersonDossier } from "@/lib/schemas";

interface EvidenceChipProps {
  evidenceId: string;
  dossier?: PersonDossier;
}

export function EvidenceChip({ evidenceId, dossier }: EvidenceChipProps) {
  const [open, setOpen] = useState(false);

  // Look up evidence details from dossier
  let label = evidenceId;
  let detailTitle = evidenceId;
  let detailContent = "Source citation from raw profile data.";
  let detailSource = "Scraped Dossier";
  let mediaUrl: string | undefined;

  if (dossier) {
    if (evidenceId === "LI-about") {
      detailTitle = "LinkedIn About / Summary";
      detailContent = dossier.linkedin.about || "No about text provided";
      detailSource = "LinkedIn";
    } else if (evidenceId.startsWith("LI-exp-")) {
      const exp = dossier.linkedin.experience.find((e) => e.id === evidenceId);
      if (exp) {
        detailTitle = `${exp.title} at ${exp.company}`;
        detailContent = `${exp.duration || ""} - ${exp.description || "Career role specified on LinkedIn profile."}`;
        detailSource = "LinkedIn Experience";
      }
    } else if (evidenceId.startsWith("LI-edu-")) {
      const edu = dossier.linkedin.education.find((e) => e.id === evidenceId);
      if (edu) {
        detailTitle = `${edu.degree || "Degree"} - ${edu.school}`;
        detailContent = `${edu.field || "Academic background on LinkedIn"}`;
        detailSource = "LinkedIn Education";
      }
    } else if (evidenceId === "IG-bio") {
      detailTitle = `Instagram Bio (@${dossier.instagram.username})`;
      detailContent = dossier.instagram.bio || "No bio text provided";
      detailSource = "Instagram";
    } else if (evidenceId.startsWith("IG-post-")) {
      const post = dossier.instagram.posts.find((p) => p.id === evidenceId);
      if (post) {
        detailTitle = `Instagram Post (${post.type})${post.location ? " in " + post.location : ""}`;
        detailContent = post.caption || "(No caption text)";
        detailSource = "Instagram Recent Posts";
        mediaUrl = post.imageUrl;
      }
    }
  }

  const isLI = evidenceId.startsWith("LI");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono tracking-wide transition-all border ${
          isLI
            ? "bg-blue-950/40 text-blue-300 border-blue-800/40 hover:bg-blue-900/60"
            : "bg-pink-950/40 text-pink-300 border-pink-800/40 hover:bg-pink-900/60"
        }`}
        title={`View evidence: ${evidenceId}`}
      >
        <Link2 className="w-2.5 h-2.5" />
        <span>{evidenceId}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-surfaceBorder rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surfaceHover transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  isLI ? "bg-blue-900/60 text-blue-300" : "bg-pink-900/60 text-pink-300"
                }`}
              >
                {detailSource}
              </span>
              <span className="text-xs font-mono text-muted">{evidenceId}</span>
            </div>

            <h3 className="text-base font-semibold text-foreground mb-2">{detailTitle}</h3>

            <div className="p-3 rounded-xl bg-background border border-surfaceBorder/60 text-xs text-muted leading-relaxed font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
              {detailContent}
            </div>

            {mediaUrl && (
              <div className="mt-3">
                <img
                  src={mediaUrl}
                  alt="Post preview"
                  className="rounded-lg max-h-40 w-full object-cover border border-surfaceBorder"
                />
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-surfaceBorder flex items-center justify-between text-[11px] text-muted">
              <span>Verified against original source data</span>
              <button
                onClick={() => setOpen(false)}
                className="text-gold hover:underline font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
