import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, Modal, Alert, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { z } from 'zod';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { titleSchema } from '../lib/titleSchema';
import { contentSchema } from '../lib/contentSchema';
import { colors } from '../styles/colors';

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
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
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
  };

  const createNewNote = () => {
    setSelectedNote(null);
    setEditTitle('');
    setEditContent('');
    setValidationErrors({ title: '', content: '' });
    setIsEditing(true);
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
  };

  const canSave = () => {
    const hasContent = editTitle.trim().length > 0 || editContent.trim().length > 0;
    const hasErrors = validationErrors.title !== '' || validationErrors.content !== '';
    return hasContent && !hasErrors;
  };

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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={notes.length === 0 ? styles.emptyScrollContent : {}}
        >
          {notes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No hay notas aún</Text>
              <Text style={styles.emptySubtitle}>Toca + para crear una</Text>
            </View>
          ) : (
            notes.map((note) => (
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
                  title="Cancelar"
                  disabled={loading}
                  style={styles.transparentButton}
                  textStyle={styles.cancelButtonText}
                />
                <Button
                  onPress={saveNote}
                  title="Listo"
                  loading={loading}
                  disabled={!canSave()}
                  style={styles.transparentButton}
                  textStyle={[
                    styles.saveButtonText,
                    !canSave() && styles.saveButtonTextDisabled,
                  ]}
                />
              </View>

              <ScrollView style={styles.editorScroll}>
                <TextField
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Título"
                  editable={!loading}
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
                    editable={!loading}
                    style={styles.contentInput}
                    error={validationErrors.content}
                    characterCount={editContent.length}
                    maxLength={5000}
                  />
                </View>
              </ScrollView>

              {selectedNote?.id && (
                <View style={styles.deleteButtonContainer}>
                  <Button
                    onPress={deleteNote}
                    title="Eliminar Nota"
                    disabled={loading}
                    style={styles.deleteButton}
                    textStyle={styles.deleteButtonText}
                  />
                </View>
              )}
            </View>
          </SafeAreaView>
        </Modal>

        <Button
          onPress={createNewNote}
          title="+"
          style={styles.floatingButton}
          textStyle={styles.floatingButtonText}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.lightest,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark,
  },
  container: {
    flex: 1,
    backgroundColor: colors.darkest,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: colors.darkest,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.darkest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.light,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  emptyScrollContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    color: colors.light,
    fontSize: 18,
  },
  emptySubtitle: {
    color: colors.medium,
    fontSize: 14,
    marginTop: 8,
  },
  noteCard: {
    backgroundColor: colors.dark,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.lightest,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    alignItems: 'center',
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.lightest,
    flex: 1,
    marginRight: 8,
  },
  noteDate: {
    fontSize: 14,
    color: colors.light,
  },
  noteContent: {
    fontSize: 15,
    color: colors.light,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.darkest,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.dark,
  },
  transparentButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 17,
    color: colors.lightest,
  },
  saveButtonText: {
    fontSize: 17,
    color: colors.lightest,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: colors.medium,
  },
  editorScroll: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.lightest,
    marginBottom: 4,
  },
  contentInputContainer: {
    marginTop: 12,
  },
  contentInput: {
    minHeight: 200,
    textAlignVertical: 'top',
    color: colors.light,
    fontSize: 16,
  },
  deleteButtonContainer: {
    padding: 16,
    borderTopWidth: 0.5,
    borderTopColor: colors.dark,
  },
  deleteButton: {
    backgroundColor: '#BF360C',
  },
  deleteButtonText: {
    color: colors.lightest,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: colors.lightest,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: colors.darkest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButtonText: {
    fontSize: 30,
    color: colors.darkest,
    fontWeight: '300',
  },
});
