import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, Modal, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { z } from 'zod';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { titleSchema } from '../lib/titleSchema';
import { contentSchema } from '../lib/contentSchema';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/styles';


// Schemas de validación con Zod
const NoteSchema = z.object({
  id: z.string(),
  title: titleSchema,
  content: contentSchema,
  date: z.string(),
});

type Note = z.infer<typeof NoteSchema>;

export default function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewingLockedNote, setIsViewingLockedNote] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [validationErrors, setValidationErrors] = useState({ title: '', content: '' });

  useEffect(() => {
    if (isEditing) {
      validateFields();
    }
  }, [editTitle, editContent, isEditing]);

  const validateFields = () => {
    const errors = { title: '', content: '' };
    if (editTitle.length > 0) {
      const result = titleSchema.safeParse(editTitle);
      if (!result.success) {
        errors.title = result.error.flatten().fieldErrors.title?.[0] || 'Título inválido';
      }
    }
    if (editContent.length > 0) {
      const result = contentSchema.safeParse(editContent);
      if (!result.success) {
        errors.content = result.error.flatten().fieldErrors.content?.[0] || 'Contenido inválido';
      }
    }
    setValidationErrors(errors);
  };

  const openNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(true);
    setIsViewingLockedNote(true);
  };

  const createNewNote = () => {
    setSelectedNote(null);
    setEditTitle('');
    setEditContent('');
    setValidationErrors({ title: '', content: '' });
    setIsEditing(true);
    setIsViewingLockedNote(false);
  };

  const saveNote = () => {
    if (!editTitle.trim() && !editContent.trim()) {
      Alert.alert('Error', 'La nota debe tener al menos un título o contenido.');
      return;
    }

    if (validationErrors.title || validationErrors.content) {
      Alert.alert('Error de validación', 'Por favor, corrige los errores de validación antes de guardar.');
      return;
    }

    setLoading(true);

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    const noteData = {
      title: editTitle.trim(),
      content: editContent.trim(),
      date: formattedDate,
    };

    if (selectedNote?.id) {
      const updatedNote = { ...selectedNote, ...noteData };
      setNotes(notes.map(note => (note.id === selectedNote.id ? updatedNote : note)));
    } else {
      const newNote = { ...noteData, id: Date.now().toString() };
      setNotes([newNote, ...notes]);
    }

    setLoading(false);
    closeEditor();
  };

  const deleteNote = () => {
    if (!selectedNote?.id) return;

    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar esta nota?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setNotes(notes.filter(note => note.id !== selectedNote.id));
            closeEditor();
          },
        },
      ],
    );
  };

  const closeEditor = () => {
    setIsEditing(false);
    setSelectedNote(null);
    setEditTitle('');
    setEditContent('');
    setValidationErrors({ title: '', content: '' });
    setIsViewingLockedNote(false);
  };

  const canSave = () => {
    const hasContent = editTitle.trim().length > 0 || editContent.trim().length > 0;
    const hasErrors = validationErrors.title !== '' || validationErrors.content !== '';
    return hasContent && !hasErrors;
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && notes.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.lightest} />
        <Text style={styles.loadingText}>Cargando notas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.headerTitle}>iNotes</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={24} color={colors.medium} style={styles.searchIcon} />
          <TextField
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar notas..."
            style={styles.searchInput}
          />
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={filteredNotes.length === 0 ? styles.emptyScrollContent : {}}
        >
          {filteredNotes.length === 0 ? (
            <View style={styles.emptyState}>
              {searchQuery ? (
                <Text style={styles.emptyTitle}>No se encontraron notas con ese título</Text>
              ) : (
                <>
                  <Text style={styles.emptyTitle}>No hay notas aún</Text>
                  <Text style={styles.emptySubtitle}>Toca + para crear una</Text>
                </>
              )}
            </View>
          ) : (
            filteredNotes.map((note) => (
              <TouchableOpacity
                key={note.id}
                onPress={() => openNote(note)}
                style={styles.noteCard}
                activeOpacity={0.7}
              >
                <View style={styles.noteHeader}>
                  <Text style={styles.noteTitle} numberOfLines={1}>
                    {note.title || 'Sin título'}
                  </Text>
                  <Text style={styles.noteDate}>{note.date}</Text>
                </View>
                <Text style={styles.noteContent} numberOfLines={2}>
                  {note.content || 'Sin contenido'}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <Modal
          visible={isEditing}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closeEditor}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Button
                  onPress={closeEditor}
                  title={isViewingLockedNote ? "Cerrar" : "Cancelar"}
                  disabled={loading}
                  style={styles.transparentButton}
                  textStyle={styles.cancelButtonText}
                />
                {isViewingLockedNote ? (
                  <TouchableOpacity
                    onPress={() => setIsViewingLockedNote(false)}
                    style={styles.headerButton}
                  >
                    <Ionicons name="create-outline" size={22} color={colors.lightest} style={styles.iconInButton} />
                    <Text style={styles.saveButtonText}>Modificar</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={saveNote}
                    disabled={!canSave() || loading}
                    style={styles.headerButton}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={colors.lightest} />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-outline"
                          size={24}
                          color={!canSave() ? colors.medium : colors.lightest}
                          style={styles.iconInButton}
                        />
                        <Text style={[styles.saveButtonText, !canSave() && styles.saveButtonTextDisabled]}>
                          Listo
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView style={styles.editorScroll}>
                <TextField
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Título"
                  editable={!loading && !isViewingLockedNote}
                  style={styles.titleInput}
                  error={validationErrors.title}
                  characterCount={editTitle.length}
                  maxLength={100}
                />

                <View style={styles.contentInputContainer}>
                  <TextField
                    value={editContent}
                    onChangeText={setEditContent}
                    placeholder="Nota"
                    multiline
                    editable={!loading && !isViewingLockedNote}
                    style={styles.contentInput}
                    error={validationErrors.content}
                    characterCount={editContent.length}
                    maxLength={5000}
                  />
                </View>
              </ScrollView>

              {selectedNote?.id && (
                <View style={styles.deleteButtonContainer}>
                  <TouchableOpacity onPress={deleteNote} disabled={loading} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={22} color={colors.lightest} style={styles.iconInButton} />
                    <Text style={styles.deleteButtonText}>Eliminar Nota</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </SafeAreaView>
        </Modal>

        <TouchableOpacity onPress={createNewNote} style={styles.floatingButton}>
          <Ionicons name="add" size={32} color={colors.darkest} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
