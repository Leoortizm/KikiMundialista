// src/pages/GruposPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Hash, Copy, Check, LogOut, Crown, Edit2, X, Trash2 } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import {
  createGrupo,
  joinGrupoByCodigo,
  getGruposByIds,
  leaveGrupo,
  regenerarCodigoInvitacion,
  removerMiembroGrupo,
  aceptarSolicitudIngreso,
  rechazarSolicitudIngreso,
  updateGrupoNombre,
  deleteGrupo,
} from '../services/gruposService';
import { getUserProfilesByIds } from '../services/usersService';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { InputField } from '../components/common/InputField';
import type { Grupo, UserProfile } from '../types';
import { PageTransition } from '../components/layout/PageTransition';
import styles from './GruposPage.module.css';
import logoSinColor from '../assets/logo_sin_color.png';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function GruposPage() {
  const { firebaseUser, userProfile } = useAuth();
  const uid = firebaseUser!.uid;

  const [grupos,       setGrupos]      = useState<Grupo[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [showCreate,   setShowCreate]  = useState(false);
  const [showJoin,     setShowJoin]    = useState(false);
  const [copiedId,     setCopiedId]    = useState<string | null>(null);

  // Form states
  const [nombre,    setNombre]    = useState('');
  const [desc,      setDesc]      = useState('');
  const [codigo,    setCodigo]    = useState('');
  const [formError, setFormError] = useState('');
  const [saving,    setSaving]    = useState(false);

  // Admin modal states
  const [selectedAdminGrupo, setSelectedAdminGrupo] = useState<Grupo | null>(null);
  const [adminMiembros,      setAdminMiembros]      = useState<UserProfile[]>([]);
  const [adminSolicitudes,   setAdminSolicitudes]   = useState<UserProfile[]>([]);
  const [loadingAdminData,   setLoadingAdminData]   = useState(false);

  // Inline edit state for renaming groups
  const [editingGrupoId, setEditingGrupoId] = useState<string | null>(null);
  const [editNombreVal,  setEditNombreVal]  = useState('');
  const [editingSaving,  setEditingSaving]  = useState(false);

  // Clave estable basada en los IDs como string — evita comparaciones de referencia de array
  const gruposIdsKey = (userProfile?.gruposIds ?? []).join(',');

  const loadGrupos = useCallback(async () => {
    const ids = userProfile?.gruposIds ?? [];
    if (ids.length === 0) { setGrupos([]); setLoading(false); return; }
    setLoading(true);
    try {
      const g = await getGruposByIds(ids);
      setGrupos(g);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gruposIdsKey]);

  // Se dispara automáticamente cuando onSnapshot actualiza userProfile.gruposIds
  useEffect(() => { loadGrupos(); }, [loadGrupos]);

  // Carga perfiles de miembros y solicitudes para el modal de administración
  const loadAdminData = useCallback(async () => {
    if (!selectedAdminGrupo) return;
    setLoadingAdminData(true);
    try {
      const miembrosUids = selectedAdminGrupo.miembros || [];
      const solicitudesUids = selectedAdminGrupo.solicitudesPendientes || [];
      const [mProfiles, sProfiles] = await Promise.all([
        getUserProfilesByIds(miembrosUids),
        getUserProfilesByIds(solicitudesUids),
      ]);
      setAdminMiembros(mProfiles);
      setAdminSolicitudes(sProfiles);
    } catch (e) {
      console.error('Error al cargar datos del grupo:', e);
    } finally {
      setLoadingAdminData(false);
    }
  }, [selectedAdminGrupo]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  async function handleCreate() {
    if (!nombre.trim()) { setFormError('El nombre es obligatorio.'); return; }
    setSaving(true); setFormError('');
    try {
      await createGrupo(uid, { nombre, descripcion: desc });
      setShowCreate(false); setNombre(''); setDesc('');
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleJoin() {
    if (codigo.length < 6) { setFormError('Ingresa el código de 6 caracteres.'); return; }
    setSaving(true); setFormError('');
    try {
      const res = await joinGrupoByCodigo(uid, codigo);
      setShowJoin(false); setCodigo('');
      if (res.estado === 'solicitado') {
        alert(`¡Solicitud enviada! Tu solicitud para ingresar al grupo "${res.grupo.nombre}" ha sido enviada al administrador. Podrás ingresar cuando sea aceptada.`);
      }
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLeave(grupoId: string) {
    if (!confirm('¿Seguro que quieres salir de este grupo?')) return;
    setGrupos((prev) => prev.filter((g) => g.id !== grupoId));
    try {
      await leaveGrupo(uid, grupoId);
    } catch (e: unknown) {
      console.error('Error al salir del grupo:', e);
      loadGrupos();
    }
  }

  async function handleDeleteGrupo(grupoId: string, grupoNombre: string) {
    if (!confirm(`⚠️ ¿Seguro que quieres ELIMINAR el grupo "${grupoNombre}"? Esta acción borrará permanentemente el grupo, desvinculará a todos sus miembros, y eliminará todas sus predicciones e historial de puntuaciones. Esta acción no se puede deshacer.`)) return;
    
    // UI Update optimista
    setGrupos((prev) => prev.filter((g) => g.id !== grupoId));
    try {
      await deleteGrupo(grupoId);
    } catch (e: unknown) {
      console.error('Error al eliminar el grupo:', e);
      alert('Error al eliminar el grupo. Inténtalo de nuevo.');
      loadGrupos(); // Rollback
    }
  }

  async function handleRefreshCodigo(grupoId: string) {
    try {
      const nuevoCodigo = await regenerarCodigoInvitacion(grupoId);
      setSelectedAdminGrupo((prev) => prev ? { ...prev, codigoInvitacion: nuevoCodigo } : null);
      loadGrupos();
    } catch {
      alert('Error al regenerar el código.');
    }
  }

  async function handleRemoverMiembro(grupoId: string, miembroUid: string) {
    if (!confirm('¿Seguro que quieres eliminar a este participante? Su progreso y predicciones se perderán.')) return;
    try {
      await removerMiembroGrupo(grupoId, miembroUid);
      setAdminMiembros((prev) => prev.filter((u) => u.uid !== miembroUid));
      setSelectedAdminGrupo((prev) => prev ? { ...prev, miembros: prev.miembros.filter(id => id !== miembroUid) } : null);
      loadGrupos();
    } catch {
      alert('Error al eliminar participante.');
    }
  }

  async function handleAceptarSolicitud(grupoId: string, miembroUid: string) {
    try {
      await aceptarSolicitudIngreso(grupoId, miembroUid);
      const user = adminSolicitudes.find((u) => u.uid === miembroUid);
      if (user) setAdminMiembros((prev) => [...prev, user]);
      setAdminSolicitudes((prev) => prev.filter((u) => u.uid !== miembroUid));
      setSelectedAdminGrupo((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          miembros: [...prev.miembros, miembroUid],
          solicitudesPendientes: (prev.solicitudesPendientes ?? []).filter(id => id !== miembroUid)
        };
      });
      loadGrupos();
    } catch {
      alert('Error al aceptar la solicitud.');
    }
  }

  async function handleRechazarSolicitud(grupoId: string, miembroUid: string) {
    try {
      await rechazarSolicitudIngreso(grupoId, miembroUid);
      setAdminSolicitudes((prev) => prev.filter((u) => u.uid !== miembroUid));
      setSelectedAdminGrupo((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          solicitudesPendientes: (prev.solicitudesPendientes ?? []).filter(id => id !== miembroUid)
        };
      });
      loadGrupos();
    } catch {
      alert('Error al rechazar la solicitud.');
    }
  }

  async function handleSaveNombre(grupoId: string) {
    if (!editNombreVal.trim()) return;
    setEditingSaving(true);
    try {
      await updateGrupoNombre(grupoId, editNombreVal);
      setEditingGrupoId(null);
      loadGrupos();
    } catch (err) {
      alert((err as Error).message ?? 'Error al actualizar el nombre del grupo.');
    } finally {
      setEditingSaving(false);
    }
  }

  function copyCodigo(codigo: string, grupoId: string) {
    navigator.clipboard.writeText(codigo);
    setCopiedId(grupoId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <PageTransition>
      <div className={`${styles.page} container`}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Mis Grupos</h1>
          <p className={styles.subtitle}>Crea o únete a una polla para competir</p>
        </div>
        <div className={styles.headerActions}>
          <Button id="btn-join-grupo" variant="success" size="md" leftIcon={<Hash size={16} />}
            onClick={() => { setFormError(''); setShowJoin(true); }}>
            Unirse con código
          </Button>
          <Button id="btn-create-grupo" variant="primary" size="md" leftIcon={<Plus size={16} />}
            onClick={() => { setFormError(''); setShowCreate(true); }}>
            Crear grupo
          </Button>
        </div>
      </div>

      {/* Grid de grupos */}
      {loading ? (
        <div className={styles.loader}><div className="spinner" style={{ width: 36, height: 36 }} /></div>
      ) : grupos.length === 0 ? (
        <div className={styles.emptyState}>
          <img src={logoSinColor} alt="KikiMundialista Logo" className={styles.emptyIcon} />
          <h2>Aún no estás en ningún grupo</h2>
          <p>Crea tu polla o pídele a un amigo el código de invitación.</p>
          <div className={styles.emptyActions}>
            <Button variant="primary" size="lg" onClick={() => setShowCreate(true)}>Crear mi primer grupo</Button>
            <Button variant="success" size="lg" onClick={() => setShowJoin(true)}>Unirme con código</Button>
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {grupos.map((g) => (
            <div
              key={g.id}
              className={`${styles.grupoCard} card card-hover`}
              onClick={() => g.adminUid === uid && setSelectedAdminGrupo(g)}
              style={{ cursor: g.adminUid === uid ? 'pointer' : 'default' }}
            >
              {/* Badge admin */}
              {g.adminUid === uid && (
                <span className={styles.adminBadge}><Crown size={12} /> Admin</span>
              )}

              <div className={styles.grupoHeader}>
                <div className={styles.grupoIcon}><Users size={22} /></div>
                <div>
                  {editingGrupoId === g.id ? (
                    <div className={styles.inlineEditRow} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        className={styles.inlineEditInput}
                        value={editNombreVal}
                        onChange={(e) => setEditNombreVal(e.target.value)}
                        maxLength={40}
                        autoFocus
                      />
                      <button
                        className={styles.inlineSaveBtn}
                        onClick={() => handleSaveNombre(g.id)}
                        disabled={editingSaving}
                        title="Guardar nombre"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        className={styles.inlineCancelBtn}
                        onClick={() => setEditingGrupoId(null)}
                        disabled={editingSaving}
                        title="Cancelar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className={styles.nombreContainer}>
                      <h3 className={styles.grupoNombre}>{g.nombre}</h3>
                      {g.adminUid === uid && (
                        <button
                          className={styles.editBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGrupoId(g.id);
                            setEditNombreVal(g.nombre);
                          }}
                          title="Editar nombre"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                  {g.descripcion && <p className={styles.grupoDesc}>{g.descripcion}</p>}
                </div>
              </div>

              <div className={styles.grupoMeta}>
                <span className={styles.metaItem}>
                  <Users size={13} /> {g.miembros.length} {g.miembros.length === 1 ? 'miembro' : 'miembros'}
                </span>
                <span className={styles.metaItem}>🏆 {g.temporada}</span>
              </div>

              {/* Código de invitación */}
              <div className={styles.codigoRow}>
                <div className={styles.codigoBox}>
                  <span className={styles.codigoLabel}>Código</span>
                  <span className={styles.codigo}>{g.codigoInvitacion}</span>
                </div>
                <button
                  className={styles.copyBtn}
                  onClick={(e) => { e.stopPropagation(); copyCodigo(g.codigoInvitacion, g.id); }}
                  title="Copiar código"
                  aria-label="Copiar código de invitación"
                >
                  {copiedId === g.id ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>

              {/* Acciones */}
              {g.adminUid === uid ? (
                <div className={styles.adminCardActions} onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Users size={14} />}
                    onClick={() => setSelectedAdminGrupo(g)}
                    style={{ flex: 1 }}
                  >
                    Administrar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 size={14} />}
                    onClick={() => handleDeleteGrupo(g.id, g.nombre)}
                  >
                    Eliminar
                  </Button>
                </div>
              ) : (
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<LogOut size={14} />}
                  onClick={(e) => { e.stopPropagation(); handleLeave(g.id); }}
                >
                  Salir del grupo
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Crear nuevo grupo">
        <div className={styles.form}>
          <InputField label="Nombre del grupo" id="create-nombre" type="text"
            value={nombre} onChange={(e) => setNombre(e.target.value)}
            placeholder="Los Primos, Oficina 3B…" maxLength={40} />
          <InputField label="Descripción (opcional)" id="create-desc" type="text"
            value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="Una breve descripción" maxLength={80} />
          {formError && <p className={styles.formError}>{formError}</p>}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button id="btn-create-confirm" variant="primary" loading={saving} onClick={handleCreate}>
              Crear grupo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Unirse */}
      <Modal isOpen={showJoin} onClose={() => setShowJoin(false)} title="Unirse con código">
        <div className={styles.form}>
          <p className={styles.joinHint}>Pídele el código de 6 caracteres al creador del grupo.</p>
          <InputField label="Código de invitación" id="join-codigo" type="text"
            value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="ABC123" maxLength={6}
            leftIcon={<Hash size={16} />} />
          {formError && <p className={styles.formError}>{formError}</p>}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setShowJoin(false)}>Cancelar</Button>
            <Button id="btn-join-confirm" variant="primary" loading={saving} onClick={handleJoin}>
              Unirme
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Administrar Grupo */}
      <Modal
        isOpen={selectedAdminGrupo !== null}
        onClose={() => setSelectedAdminGrupo(null)}
        title={`Administrar Grupo: ${selectedAdminGrupo?.nombre ?? ''}`}
      >
        {selectedAdminGrupo && (
          <div className={styles.adminModalContent}>
            {selectedAdminGrupo.descripcion && (
              <p className={styles.adminModalDesc}>{selectedAdminGrupo.descripcion}</p>
            )}

            {/* Código de Invitación */}
            <div className={styles.adminSection}>
              <h4 className={styles.adminSectionTitle}>Código de invitación</h4>
              <div className={styles.adminCodigoRow}>
                <div className={styles.adminCodigoBox}>
                  <span className={styles.adminCodigo}>{selectedAdminGrupo.codigoInvitacion}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRefreshCodigo(selectedAdminGrupo.id)}
                >
                  Regenerar código
                </Button>
              </div>
            </div>

            {/* Solicitudes de Ingreso */}
            <div className={styles.adminSection}>
              <h4 className={styles.adminSectionTitle}>
                Solicitudes de ingreso ({adminSolicitudes.length})
              </h4>
              {loadingAdminData ? (
                <div className={styles.adminSpinnerWrap}>
                  <div className="spinner" style={{ width: 24, height: 24 }} />
                </div>
              ) : adminSolicitudes.length === 0 ? (
                <p className={styles.adminEmptyText}>No hay solicitudes pendientes.</p>
              ) : (
                <div className={styles.adminList}>
                  {adminSolicitudes.map((user) => (
                    <div key={user.uid} className={styles.adminListItem}>
                      <div className={styles.adminUserWrap}>
                        <div className={styles.adminAvatar}>
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} className={styles.adminAvatarImg} referrerPolicy="no-referrer" />
                          ) : (
                            <span className={styles.adminAvatarInitials}>{getInitials(user.displayName)}</span>
                          )}
                        </div>
                        <span className={styles.adminUserName}>{user.displayName}</span>
                      </div>
                      <div className={styles.adminListActions}>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleAceptarSolicitud(selectedAdminGrupo.id, user.uid)}
                        >
                          Aceptar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRechazarSolicitud(selectedAdminGrupo.id, user.uid)}
                        >
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Integrantes del grupo */}
            <div className={styles.adminSection}>
              <h4 className={styles.adminSectionTitle}>
                Participantes ({adminMiembros.length})
              </h4>
              {loadingAdminData ? (
                <div className={styles.adminSpinnerWrap}>
                  <div className="spinner" style={{ width: 24, height: 24 }} />
                </div>
              ) : (
                <div className={styles.adminList}>
                  {adminMiembros.map((user) => (
                    <div key={user.uid} className={styles.adminListItem}>
                      <div className={styles.adminUserWrap}>
                        <div className={styles.adminAvatar}>
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} className={styles.adminAvatarImg} referrerPolicy="no-referrer" />
                          ) : (
                            <span className={styles.adminAvatarInitials}>{getInitials(user.displayName)}</span>
                          )}
                        </div>
                        <span className={styles.adminUserName}>
                          {user.displayName}
                          {user.uid === selectedAdminGrupo.adminUid && (
                            <span className={styles.adminOwnerBadge}>Creador</span>
                          )}
                        </span>
                      </div>
                      <div className={styles.adminListActions}>
                        {user.uid !== selectedAdminGrupo.adminUid && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoverMiembro(selectedAdminGrupo.id, user.uid)}
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.adminModalFooter}>
              <Button variant="secondary" onClick={() => setSelectedAdminGrupo(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
      </div>
    </PageTransition>
  );
}
