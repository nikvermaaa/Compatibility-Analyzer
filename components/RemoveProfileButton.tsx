"use client";

import React from "react";

export function RemoveProfileButton() {
  return (
    <button
      type="button"
      className="text-xs text-muted/60 hover:text-red-400 underline transition-colors"
      onClick={() => alert("Profile deletion requested. To remove this profile and purge raw scrapes, contact the administrator.")}
    >
      Remove this profile
    </button>
  );
}
