import React from 'react'
import styles from './BacteriaInfoModal.module.css'

type Profile = any

interface Props {
  profile: Profile
  onClose: () => void
}

const riskColor = (level: string) => {
  switch ((level || '').toLowerCase()) {
    case 'high': return '#dc2626'
    case 'moderate': return '#f59e0b'
    case 'variable': return '#6b7280'
    default: return '#6b7280'
  }
}

export default function BacteriaInfoModal({ profile, onClose }: Props) {
  if (!profile) return null
  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.card} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>{profile.displayName}</div>
            <div style={{ color: '#6b7280', fontSize: 13 }}>{profile.gramStain} • {profile.morphology} • {profile.oxygenRequirements}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className={styles.risk} style={{ background: riskColor(profile.riskLevel), color: '#fff' }}>{(profile.riskLevel || '').toUpperCase()}</div>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800 }}>Close</button>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.smallLabel}>Bacterial Characterization</div>
          <div className={styles.twoCol}>
            <div>
              <div style={{ marginTop: 8 }}><strong>Gram stain:</strong> {profile.gramStain}</div>
              <div style={{ marginTop: 8 }}><strong>Morphology & arrangement:</strong> {profile.morphology}{profile.arrangement ? `, ${profile.arrangement}` : ''}</div>
              <div style={{ marginTop: 8 }}><strong>Oxygen requirements:</strong> {profile.oxygenRequirements}</div>
              <div style={{ marginTop: 8 }}><strong>Motility:</strong> {profile.motility}</div>
              <div style={{ marginTop: 8 }}><strong>Spore formation:</strong> {profile.sporeFormation}</div>
            </div>
            <div>
              <div className={styles.smallLabel}>Key biochemical characteristics</div>
              <div className={styles.biochemList}>
                {profile.biochemical && Object.entries(profile.biochemical).map(([k,v]: [string, any]) => (
                  <div key={k}><strong>{k}:</strong> {String(v)}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.smallLabel}>Natural Habitat & Sources</div>
          <div style={{ marginTop: 8 }}><strong>Primary:</strong> {profile.habitat?.primary}</div>
          <div style={{ marginTop: 6 }}><strong>Secondary:</strong> {profile.habitat?.secondary}</div>
          <div style={{ marginTop: 6 }}><strong>Environmental conditions:</strong> {profile.habitat?.conditions}</div>
          <div style={{ marginTop: 6 }}><strong>Common reservoirs:</strong> {(profile.habitat?.reservoirs || []).join(', ')}</div>
        </div>

        <div className={styles.section}>
          <div className={styles.smallLabel}>Contamination & Health Risks</div>
          <div style={{ marginTop: 8 }}><strong>Infections caused:</strong> {(profile.contaminationAndHealthRisks?.infections || []).join(', ')}</div>
          <div style={{ marginTop: 6 }}><strong>Pathogenicity:</strong> {profile.contaminationAndHealthRisks?.pathogenicity}</div>
          <div style={{ marginTop: 6 }}><strong>Transmission routes:</strong> {(profile.contaminationAndHealthRisks?.transmissionRoutes || []).join(', ')}</div>
          <div style={{ marginTop: 6 }}><strong>Clinical symptoms:</strong> {profile.contaminationAndHealthRisks?.clinicalSymptoms}</div>
          <div style={{ marginTop: 6 }}><strong>At-risk populations:</strong> {(profile.contaminationAndHealthRisks?.atRiskPopulations || []).join(', ')}</div>
          <div style={{ marginTop: 6 }}><strong>Antibiotic resistance concerns:</strong> {profile.contaminationAndHealthRisks?.antibioticResistanceConcerns || 'Varies by strain'}</div>
        </div>

        <div className={styles.section}>
          <div className={styles.smallLabel}>Food Association</div>
          <div style={{ marginTop: 8 }}><strong>Commonly associated foods:</strong> {(profile.foodAssociation?.commonFoods || []).join(', ')}</div>
          <div style={{ marginTop: 6 }}><strong>How contamination occurs:</strong> {profile.foodAssociation?.howContaminationOccurs}</div>
          <div style={{ marginTop: 6 }}><strong>Typical contamination sources:</strong> {(profile.foodAssociation?.typicalSources || []).join(', ')}</div>
          <div style={{ marginTop: 6 }}><strong>Prevention & control:</strong> {profile.foodAssociation?.preventionAndControl}</div>
          <div style={{ marginTop: 6 }}><strong>Handling & cooking:</strong> {profile.foodAssociation?.handlingAndCooking}</div>
          <div style={{ marginTop: 6 }}><strong>Storage:</strong> {profile.foodAssociation?.storage}</div>
        </div>
      </div>
    </div>
  )
}
