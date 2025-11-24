import React, { useState } from 'react'
import styles from './BacteriaInfoCard.module.css'

type Profile = any

interface Props {
  profile: Profile
  compact?: boolean
}

const sectionIcons: Record<string, string> = {
  characterization: '🔬',
  habitat: '🌍',
  health: '⚠️',
  food: '🍽️',
}

const getRiskColor = (level: string) => {
  const l = (level || '').toLowerCase()
  if (l.includes('high') || l.includes('pathogenic')) return '#dc2626'
  if (l.includes('moderate') || l.includes('opportunistic')) return '#f59e0b'
  if (l.includes('safe')) return '#10b981'
  return '#6b7280'
}

const getRiskBg = (level: string) => {
  const l = (level || '').toLowerCase()
  if (l.includes('high') || l.includes('pathogenic')) return '#fee2e2'
  if (l.includes('moderate') || l.includes('opportunistic')) return '#fef3c7'
  if (l.includes('safe')) return '#d1fae5'
  return '#f3f4f6'
}

export default function BacteriaInfoCard({ profile, compact = false }: Props) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    characterization: true,
    habitat: true,
    health: true,
    food: true,
  })

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!profile) return null

  const riskLevel = profile.riskLevel || profile.contaminationAndHealthRisks?.riskBadge || 'Unknown'
  const riskColor = getRiskColor(riskLevel)
  const riskBg = getRiskBg(riskLevel)

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{profile.displayName}</h2>
          <p className={styles.subtitle}>
            {profile.gramStain} • {profile.morphology} • {profile.oxygenRequirements}
          </p>
        </div>
        <div
          className={styles.riskBadge}
          style={{ backgroundColor: riskBg, color: riskColor, borderColor: riskColor }}
        >
          {(riskLevel || 'UNKNOWN').toUpperCase()}
        </div>
      </div>

      {/* Section A: Bacterial Characterization */}
      <div className={styles.section}>
        <button
          className={styles.sectionHeader}
          onClick={() => toggleSection('characterization')}
        >
          <span className={styles.icon}>{sectionIcons.characterization}</span>
          <span className={styles.sectionTitle}>Bacterial Characterization</span>
          <span className={styles.toggle}>{expandedSections.characterization ? '▼' : '▶'}</span>
        </button>
        {expandedSections.characterization && (
          <div className={styles.sectionContent}>
            <div className={styles.twoCol}>
              <div>
                <div className={styles.row}>
                  <span className={styles.label}>Gram Stain:</span>
                  <span className={styles.value}>{profile.gramStain}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Morphology:</span>
                  <span className={styles.value}>{profile.morphology}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Arrangement:</span>
                  <span className={styles.value}>{profile.arrangement}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Oxygen Requirements:</span>
                  <span className={styles.value}>{profile.oxygenRequirements}</span>
                </div>
              </div>
              <div>
                <div className={styles.row}>
                  <span className={styles.label}>Motility:</span>
                  <span className={styles.value}>{profile.motility}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Spore Formation:</span>
                  <span className={styles.value}>{profile.sporeFormation}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Growth Temp:</span>
                  <span className={styles.value}>{profile.optimalGrowthTemperature || 'Varies'}</span>
                </div>
              </div>
            </div>

            <div className={styles.biochemList}>
              <div className={styles.label} style={{ marginTop: 12 }}>Key Biochemical Tests:</div>
              {profile.biochemical && Object.entries(profile.biochemical).map(([k, v]: [string, any]) => (
                <div key={k} className={styles.biochemRow}>
                  <span className={styles.testName}>{k}:</span>
                  <span className={styles.testResult}>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section B: Natural Habitat & Sources */}
      <div className={styles.section}>
        <button
          className={styles.sectionHeader}
          onClick={() => toggleSection('habitat')}
        >
          <span className={styles.icon}>{sectionIcons.habitat}</span>
          <span className={styles.sectionTitle}>Natural Habitat & Sources</span>
          <span className={styles.toggle}>{expandedSections.habitat ? '▼' : '▶'}</span>
        </button>
        {expandedSections.habitat && (
          <div className={styles.sectionContent}>
            <div className={styles.row}>
              <span className={styles.label}>Primary Habitat:</span>
              <span className={styles.value}>{profile.habitat?.primary}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Secondary Locations:</span>
              <span className={styles.value}>{profile.habitat?.secondary}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Environmental Conditions:</span>
              <span className={styles.value}>{profile.habitat?.conditions}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Natural Reservoirs:</span>
              <span className={styles.value}>{(profile.habitat?.reservoirs || []).join(', ')}</span>
            </div>
            {profile.habitat?.geographicDistribution && (
              <div className={styles.row}>
                <span className={styles.label}>Geographic Distribution:</span>
                <span className={styles.value}>{profile.habitat.geographicDistribution}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section C: Health & Contamination Risks */}
      <div className={styles.section}>
        <button
          className={styles.sectionHeader}
          onClick={() => toggleSection('health')}
        >
          <span className={styles.icon}>{sectionIcons.health}</span>
          <span className={styles.sectionTitle}>Health & Contamination Risks</span>
          <span className={styles.toggle}>{expandedSections.health ? '▼' : '▶'}</span>
        </button>
        {expandedSections.health && (
          <div className={styles.sectionContent}>
            <div className={styles.row}>
              <span className={styles.label}>Infections Caused:</span>
              <span className={styles.value}>{(profile.contaminationAndHealthRisks?.infections || []).join(', ')}</span>
            </div>
            {profile.contaminationAndHealthRisks?.targetOrgans && (
              <div className={styles.row}>
                <span className={styles.label}>Target Organs/Systems:</span>
                <span className={styles.value}>{(profile.contaminationAndHealthRisks.targetOrgans || []).join(', ')}</span>
              </div>
            )}
            <div className={styles.row}>
              <span className={styles.label}>Pathogenicity:</span>
              <span className={styles.value}>{profile.contaminationAndHealthRisks?.pathogenicity}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Transmission Routes:</span>
              <span className={styles.value}>{(profile.contaminationAndHealthRisks?.transmissionRoutes || []).join(', ')}</span>
            </div>
            {profile.contaminationAndHealthRisks?.symptomsTimeline && (
              <div className={styles.row}>
                <span className={styles.label}>Symptoms Timeline:</span>
                <span className={styles.value}>{profile.contaminationAndHealthRisks.symptomsTimeline}</span>
              </div>
            )}
            <div className={styles.row}>
              <span className={styles.label}>Clinical Symptoms:</span>
              <span className={styles.value}>{profile.contaminationAndHealthRisks?.clinicalSymptoms}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>At-Risk Populations:</span>
              <span className={styles.value}>{(profile.contaminationAndHealthRisks?.atRiskPopulations || []).join(', ')}</span>
            </div>
            {profile.contaminationAndHealthRisks?.infectiousDose && (
              <div className={styles.row}>
                <span className={styles.label}>Infectious Dose:</span>
                <span className={styles.value}>{profile.contaminationAndHealthRisks.infectiousDose}</span>
              </div>
            )}
            <div className={styles.row}>
              <span className={styles.label}>Antibiotic Resistance:</span>
              <span className={styles.value}>{profile.contaminationAndHealthRisks?.antibioticResistanceConcerns || 'Varies'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Section D: Food Safety Information */}
      <div className={styles.section}>
        <button
          className={styles.sectionHeader}
          onClick={() => toggleSection('food')}
        >
          <span className={styles.icon}>{sectionIcons.food}</span>
          <span className={styles.sectionTitle}>Food Safety Information</span>
          <span className={styles.toggle}>{expandedSections.food ? '▼' : '▶'}</span>
        </button>
        {expandedSections.food && (
          <div className={styles.sectionContent}>
            <div className={styles.row}>
              <span className={styles.label}>Commonly Contaminated Foods:</span>
              <span className={styles.value}>{(profile.foodAssociation?.commonFoods || []).join(', ')}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>How Contamination Occurs:</span>
              <span className={styles.value}>{profile.foodAssociation?.howContaminationOccurs}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Typical Contamination Sources:</span>
              <span className={styles.value}>{(profile.foodAssociation?.typicalSources || []).join(', ')}</span>
            </div>
            {profile.foodAssociation?.growthConditionsInFood && (
              <div className={styles.row}>
                <span className={styles.label}>Growth Conditions in Food:</span>
                <span className={styles.value}>{profile.foodAssociation.growthConditionsInFood}</span>
              </div>
            )}
            <div className={styles.row}>
              <span className={styles.label}>Prevention & Control:</span>
              <span className={styles.value}>{profile.foodAssociation?.preventionAndControl}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Safe Handling & Cooking:</span>
              <span className={styles.value}>{profile.foodAssociation?.handlingAndCooking}</span>
            </div>
            {profile.foodAssociation?.temperatureControl && (
              <div className={styles.row}>
                <span className={styles.label}>Temperature Control:</span>
                <span className={styles.value}>{profile.foodAssociation.temperatureControl}</span>
              </div>
            )}
            <div className={styles.row}>
              <span className={styles.label}>Storage Requirements:</span>
              <span className={styles.value}>{profile.foodAssociation?.storage}</span>
            </div>
            {profile.foodAssociation?.shelfLife && (
              <div className={styles.row}>
                <span className={styles.label}>Shelf Life:</span>
                <span className={styles.value}>{profile.foodAssociation.shelfLife}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
