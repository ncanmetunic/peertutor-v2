import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Chip, Searchbar } from 'react-native-paper';
import { colors, spacing, typography, borderRadius } from '../constants';
import { subjects, categories } from '../constants/subjects';

export default function TagPicker({
  selectedTags = [],
  onTagsChange,
  title = "Select Topics",
  maxSelection = null
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter subjects based on search and category
  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || subject.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleTag = (tagId) => {
    if (selectedTags.includes(tagId)) {
      // Remove tag
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      // Add tag (if max not reached)
      if (maxSelection && selectedTags.length >= maxSelection) {
        return;
      }
      onTagsChange([...selectedTags, tagId]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {/* Search bar */}
      <Searchbar
        placeholder="Search topics..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
      >
        <Chip
          selected={selectedCategory === 'All'}
          onPress={() => setSelectedCategory('All')}
          style={styles.categoryChip}
        >
          All
        </Chip>
        {categories.map(category => (
          <Chip
            key={category}
            selected={selectedCategory === category}
            onPress={() => setSelectedCategory(category)}
            style={styles.categoryChip}
          >
            {category}
          </Chip>
        ))}
      </ScrollView>

      {/* Selected count */}
      {maxSelection && (
        <Text style={styles.countText}>
          Selected: {selectedTags.length} / {maxSelection}
        </Text>
      )}

      {/* Tag grid */}
      <ScrollView style={styles.tagScrollView}>
        <View style={styles.tagGrid}>
          {filteredSubjects.map(subject => {
            const isSelected = selectedTags.includes(subject.id);
            return (
              <TouchableOpacity
                key={subject.id}
                onPress={() => handleToggleTag(subject.id)}
                style={[
                  styles.tag,
                  isSelected && styles.tagSelected,
                ]}
              >
                <Text style={[
                  styles.tagText,
                  isSelected && styles.tagTextSelected,
                ]}>
                  {subject.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredSubjects.length === 0 && (
          <Text style={styles.noResults}>No topics found</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  searchbar: {
    marginBottom: spacing.md,
    elevation: 0,
    backgroundColor: colors.surface,
  },
  categoryContainer: {
    marginBottom: spacing.md,
    maxHeight: 50,
  },
  categoryChip: {
    marginRight: spacing.sm,
  },
  countText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  tagScrollView: {
    flex: 1,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    margin: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  tagSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagText: {
    ...typography.body2,
    color: colors.text,
  },
  tagTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  noResults: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
