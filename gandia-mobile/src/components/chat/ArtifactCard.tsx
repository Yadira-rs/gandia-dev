// ArtifactCard — TODO: implementar
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function ArtifactCard() {
  return (
    <View style={s.root}>
      <Text style={s.text}>ArtifactCard</Text>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafaf9' },
  text: { fontSize: 16, color: '#1c1917' },
})
