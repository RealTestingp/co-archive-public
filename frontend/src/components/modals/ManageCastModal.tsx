import { useState, useEffect, useMemo } from "react";
import { api } from "../../api";
import Dropdown from "../dropdown/Dropdown";
import { useTheme } from "../../context/ThemeContext";

// Manage a production's cast AFTER it's been created — the additive/removal
// counterpart to the Add Production wizard. Uses AppearancesController
// directly (POST to assign, DELETE to remove) plus /api/characters to add a
// forgotten character to the opera.

interface CastMember {
  appearanceId?: number; // now returned by GET /api/productions/{id}
  personId?: number;
  firstName: string;
  lastName: string;
  contributorType: string;
  characterId?: number | null;
  character: string | null;
}

interface Character {
  id: number;
  name: string;
}

interface PersonSearchResult {
  id: number;
  firstName: string;
  lastName: string;
}

interface LookupItem {
  id: number;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onChanged?: () => void; // called after any add/remove so the page refetches
  productionId: number;
  productionTitle: string;
  operaId: number | null;
  cast: CastMember[];
}

const DD = {
  size: "md",
  block: true,
  portal: true,
  theme: "auto",
  highlightWhenSet: false,
} as const;

const ManageCastModal = ({
  isOpen,
  onClose,
  onChanged,
  productionId,
  productionTitle,
  operaId,
  cast,
}: Props) => {
  const { isDark, colors } = useTheme();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [artistTypeId, setArtistTypeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Assign form
  const [assignCharacterId, setAssignCharacterId] = useState("");
  const [personSearch, setPersonSearch] = useState("");
  const [personResults, setPersonResults] = useState<PersonSearchResult[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<PersonSearchResult | null>(
    null,
  );

  // Add-character
  const [newCharacterName, setNewCharacterName] = useState("");

  // Reassign — change who plays a role, keeping the character.
  const [reassigningId, setReassigningId] = useState<number | null>(null);
  const [reassignSearch, setReassignSearch] = useState("");
  const [reassignResults, setReassignResults] = useState<PersonSearchResult[]>(
    [],
  );

  // ── Theme tokens ──
  const overlay = "rgba(0,0,0,0.5)";
  const surface = isDark ? "#1c1c1c" : "#fff";
  const border = isDark ? "#2a2a2a" : "#e5e7eb";
  const borderLight = isDark ? "#2a2a2a" : "#f3f4f6";
  const inputBg = isDark ? "#161616" : "#fff";
  const textPrimary = colors.textPrimary;
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const textMuted = isDark ? "#6b7280" : "#9ca3af";
  const dangerBg = isDark ? "#2a1414" : "#fef2f2";
  const dangerBorder = isDark ? "#4a2020" : "#fecaca";
  const hoverBg = isDark ? "#242424" : "#f9fafb";

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    fontSize: "13px",
    fontFamily: "Inter, sans-serif",
    border: `1px solid ${border}`,
    borderRadius: "6px",
    outline: "none",
    boxSizing: "border-box",
    color: textPrimary,
    background: inputBg,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: textSecondary,
    marginBottom: "5px",
    display: "block",
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: textMuted,
    marginBottom: "0.75rem",
  };

  // Only the Artist (main cast) appearances are managed here.
  const castMembers = cast.filter((c) => /artist/i.test(c.contributorType));

  const characterOptions = useMemo(
    () => characters.map((c) => ({ value: String(c.id), label: c.name })),
    [characters],
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [charsRes, typesRes] = await Promise.all([
        operaId != null
          ? api.get(`/api/characters?operaId=${operaId}`)
          : Promise.resolve(null),
        api.get(`/api/contributortypes`),
      ]);

      if (charsRes && charsRes.ok) setCharacters(await charsRes.json());

      if (typesRes.ok) {
        const types: LookupItem[] = await typesRes.json();
        const artist = types.find((t) => /^artist$/i.test(t.name));
        setArtistTypeId(artist ? artist.id : null);
      }
    } catch {
      setError("Failed to load characters. Is the API running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setAssignCharacterId("");
    setPersonSearch("");
    setPersonResults([]);
    setSelectedPerson(null);
    setNewCharacterName("");
    setReassigningId(null);
    setReassignSearch("");
    setReassignResults([]);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, operaId]);

  const searchPersons = async (q: string) => {
    setPersonSearch(q);
    setSelectedPerson(null);
    if (q.trim().length < 2) {
      setPersonResults([]);
      return;
    }
    try {
      const res = await api.get(`/api/persons?search=${encodeURIComponent(q)}`);
      if (res.ok) setPersonResults(await res.json());
    } catch {
      /* ignore */
    }
  };

  const handleAssign = async () => {
    if (!selectedPerson) {
      setError("Search and pick a person to assign.");
      return;
    }
    if (artistTypeId == null) {
      setError("Couldn't resolve the Artist contributor type.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.post("/api/appearances", {
        productionId,
        personId: selectedPerson.id,
        // Character is optional — no-opera productions (galas/concerts) assign
        // cast without one.
        characterId: assignCharacterId ? Number(assignCharacterId) : null,
        contributorTypeId: artistTypeId,
      });
      if (res.status === 409) {
        setError("That person is already assigned to this character.");
        return;
      }
      if (!res.ok) throw new Error();
      // Reset the assign form and let the page refetch the cast.
      setAssignCharacterId("");
      setPersonSearch("");
      setSelectedPerson(null);
      setPersonResults([]);
      onChanged?.();
    } catch {
      setError("Failed to assign. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (appearanceId?: number) => {
    if (appearanceId == null) {
      setError("This cast row is missing its appearance id — can't remove it.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.delete(`/api/appearances/${appearanceId}`);
      if (!res.ok) throw new Error();
      onChanged?.();
    } catch {
      setError("Failed to remove. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const startReassign = (appearanceId?: number) => {
    if (appearanceId == null) {
      setError("This cast row is missing its appearance id — can't change it.");
      return;
    }
    setReassigningId(appearanceId);
    setReassignSearch("");
    setReassignResults([]);
    setError(null);
  };

  const cancelReassign = () => {
    setReassigningId(null);
    setReassignSearch("");
    setReassignResults([]);
  };

  const searchReassign = async (q: string) => {
    setReassignSearch(q);
    if (q.trim().length < 2) {
      setReassignResults([]);
      return;
    }
    try {
      const res = await api.get(`/api/persons?search=${encodeURIComponent(q)}`);
      if (res.ok) setReassignResults(await res.json());
    } catch {
      /* ignore */
    }
  };

  // Recast a role: create the new appearance (same character) first, then
  // delete the old one, so the slot is never empty mid-swap.
  const handleReassign = async (
    member: CastMember,
    newPerson: PersonSearchResult,
  ) => {
    if (member.appearanceId == null) {
      setError("This cast row is missing its appearance id.");
      return;
    }
    if (artistTypeId == null) {
      setError("Couldn't resolve the Artist contributor type.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const createRes = await api.post("/api/appearances", {
        productionId,
        personId: newPerson.id,
        characterId: member.characterId ?? null,
        contributorTypeId: artistTypeId,
      });
      if (createRes.status === 409) {
        setError("That person is already in this role.");
        return;
      }
      if (!createRes.ok) throw new Error();
      const delRes = await api.delete(
        `/api/appearances/${member.appearanceId}`,
      );
      if (!delRes.ok) throw new Error();
      cancelReassign();
      onChanged?.();
    } catch {
      setError("Failed to change the cast member. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleAddCharacter = async () => {
    if (!newCharacterName.trim()) return;
    if (operaId == null) {
      setError("This production has no opera, so characters can't be added.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.post("/api/characters", {
        name: newCharacterName.trim(),
        operaId,
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      // Add to the local list and pre-select it for assignment.
      setCharacters((prev) => [
        ...prev,
        { id: created.id, name: newCharacterName.trim() },
      ]);
      setAssignCharacterId(String(created.id));
      setNewCharacterName("");
    } catch {
      setError("Failed to add character. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: overlay,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: surface,
          border: `1px solid ${border}`,
          borderRadius: "10px",
          padding: "2rem",
          width: "100%",
          maxWidth: "520px",
          boxShadow: isDark
            ? "0 20px 60px rgba(0,0,0,0.6)"
            : "0 20px 60px rgba(0,0,0,0.15)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: textPrimary }}>
              Manage Cast
            </h2>
            <div
              style={{ fontSize: "12px", color: textMuted, marginTop: "2px" }}
            >
              {productionTitle}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              fontSize: "18px",
              color: textMuted,
              cursor: "pointer",
              background: "none",
              border: "none",
            }}
          >
            ✕
          </button>
        </div>

        {/* Error sits right under the header so it's always visible near the
            action, not buried at the bottom of a long modal. */}
        {error && (
          <div
            style={{
              fontSize: "12px",
              color: "#9B1C1C",
              marginBottom: "1.25rem",
              padding: "8px 12px",
              background: dangerBg,
              borderRadius: "6px",
              border: `1px solid ${dangerBorder}`,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem 0",
              fontSize: "13px",
              color: textSecondary,
            }}
          >
            Loading…
          </div>
        ) : (
          <>
            {/* Current cast */}
            <div style={sectionTitle}>Current Cast</div>
            <div
              style={{
                border: `1px solid ${border}`,
                borderRadius: "8px",
                overflow: "hidden",
                marginBottom: "1.5rem",
              }}
            >
              {castMembers.length === 0 ? (
                <div
                  style={{
                    padding: "1rem",
                    fontSize: "13px",
                    color: textMuted,
                  }}
                >
                  No cast assigned yet.
                </div>
              ) : (
                castMembers.map((m, i) => (
                  <div
                    key={m.appearanceId ?? i}
                    style={{
                      padding: "10px 14px",
                      borderBottom:
                        i < castMembers.length - 1
                          ? `1px solid ${borderLight}`
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <div style={{ fontSize: "13px", color: textPrimary }}>
                        <span style={{ fontWeight: 500 }}>
                          {m.lastName}, {m.firstName}
                        </span>
                        {m.character && (
                          <span style={{ color: textSecondary }}>
                            {" "}
                            — {m.character}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                        {/* Change = recast this role to a different person. */}
                        <button
                          onClick={() =>
                            reassigningId === m.appearanceId
                              ? cancelReassign()
                              : startReassign(m.appearanceId)
                          }
                          disabled={busy}
                          style={{
                            fontSize: "12px",
                            fontWeight: 500,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            cursor: busy ? "not-allowed" : "pointer",
                            border: `1px solid ${border}`,
                            background: surface,
                            color: textPrimary,
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {reassigningId === m.appearanceId ? "Cancel" : "Change"}
                        </button>
                        <button
                          onClick={() => handleRemove(m.appearanceId)}
                          disabled={busy}
                          style={{
                            fontSize: "12px",
                            fontWeight: 500,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            cursor: busy ? "not-allowed" : "pointer",
                            border: `1px solid ${dangerBorder}`,
                            background: dangerBg,
                            color: "#9B1C1C",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Inline recast search for this row. */}
                    {reassigningId === m.appearanceId && (
                      <div style={{ position: "relative", marginTop: "8px" }}>
                        <input
                          type="text"
                          autoFocus
                          placeholder={`Search a replacement for ${m.character ?? `${m.firstName} ${m.lastName}`}…`}
                          style={inputStyle}
                          value={reassignSearch}
                          onChange={(e) => searchReassign(e.target.value)}
                        />
                        {reassignResults.length > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              background: surface,
                              border: `1px solid ${border}`,
                              borderRadius: "6px",
                              boxShadow: isDark
                                ? "0 4px 12px rgba(0,0,0,0.5)"
                                : "0 4px 12px rgba(0,0,0,0.1)",
                              zIndex: 10,
                              maxHeight: "160px",
                              overflowY: "auto",
                            }}
                          >
                            {reassignResults.map((p) => (
                              <div
                                key={p.id}
                                onClick={() => handleReassign(m, p)}
                                style={{
                                  padding: "7px 12px",
                                  fontSize: "13px",
                                  cursor: "pointer",
                                  color: textPrimary,
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = hoverBg)
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    "transparent")
                                }
                              >
                                {p.firstName} {p.lastName}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Assign a person to a character */}
            <div style={sectionTitle}>Assign a Person</div>
            {operaId != null ? (
              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>Character (optional)</label>
                <Dropdown
                  {...DD}
                  placeholder="Select character"
                  ariaLabel="Character"
                  value={assignCharacterId}
                  options={characterOptions}
                  onChange={setAssignCharacterId}
                />
              </div>
            ) : (
              <p
                style={{
                  fontSize: "12px",
                  color: textMuted,
                  marginBottom: "1rem",
                }}
              >
                This production has no opera, so cast is assigned without a
                character.
              </p>
            )}
            <div style={{ marginBottom: "0.75rem", position: "relative" }}>
              <label style={labelStyle}>Person</label>
              <input
                type="text"
                placeholder="Search person…"
                style={inputStyle}
                value={personSearch}
                onChange={(e) => searchPersons(e.target.value)}
              />
              {!selectedPerson && personResults.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: surface,
                    border: `1px solid ${border}`,
                    borderRadius: "6px",
                    boxShadow: isDark
                      ? "0 4px 12px rgba(0,0,0,0.5)"
                      : "0 4px 12px rgba(0,0,0,0.1)",
                    zIndex: 10,
                    maxHeight: "160px",
                    overflowY: "auto",
                  }}
                >
                  {personResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPerson(p);
                        setPersonSearch(`${p.firstName} ${p.lastName}`);
                        setPersonResults([]);
                      }}
                      style={{
                        padding: "7px 12px",
                        fontSize: "13px",
                        cursor: "pointer",
                        color: textPrimary,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = hoverBg)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      {p.firstName} {p.lastName}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleAssign}
              disabled={busy || !selectedPerson}
              style={{
                fontSize: "12px",
                fontWeight: 500,
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: busy || !selectedPerson ? "not-allowed" : "pointer",
                border: "1px solid #9B1C1C",
                background: "#9B1C1C",
                color: "#fff",
                opacity: busy || !selectedPerson ? 0.6 : 1,
                fontFamily: "Inter, sans-serif",
                marginBottom: "1.5rem",
              }}
            >
              {busy ? "Working…" : "Assign to Cast"}
            </button>

            {/* Add a missing character */}
            {operaId != null && (
              <>
                <div style={sectionTitle}>Add a Missing Character</div>
                <div
                  style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}
                >
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Character Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Violetta"
                      style={inputStyle}
                      value={newCharacterName}
                      onChange={(e) => setNewCharacterName(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleAddCharacter}
                    disabled={busy || !newCharacterName.trim()}
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      padding: "8px 14px",
                      borderRadius: "6px",
                      cursor:
                        busy || !newCharacterName.trim()
                          ? "not-allowed"
                          : "pointer",
                      border: `1px solid ${border}`,
                      background: surface,
                      color: textPrimary,
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Add
                  </button>
                </div>
                <p
                  style={{
                    fontSize: "11px",
                    color: textMuted,
                    marginTop: "6px",
                    marginBottom: 0,
                  }}
                >
                  New characters are added to the opera and selected above,
                  ready to assign.
                </p>
              </>
            )}

            {/* Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "1.5rem",
                paddingTop: "1rem",
                borderTop: `1px solid ${borderLight}`,
              }}
            >
              <button
                onClick={onClose}
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  padding: "8px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: `1px solid ${border}`,
                  background: surface,
                  color: textPrimary,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManageCastModal;