import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, Modal, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { z } from 'zod';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { titleSchema } from '../lib/titleSchema';
import { contentSchema } from '../lib/contentSchema';

// Configura tu URL base de la API
const API_URL = 'https://8554-firebase-myfirstsumativeapp-1763932350939.cluster-f73ibkkuije66wssuontdtbx6q.cloudworkstations.dev';

// Schemas de validación con Zod
const NoteSchema = z.object({
  id: z.number().optional(),
  title: titleSchema,
  content: contentSchema,
  date: z.string()
});

type Note = z.infer<typeof NoteSchema>;

const NoteCreateSchema = z.object({
  title: titleSchema,
  content: contentSchema,
  date: z.string()
});

const NotesArraySchema = z.array(NoteSchema);

export default function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [validationErrors, setValidationErrors] = useState({ title: '', content: '' });

  // Cargar notas al iniciar la app
  useEffect(() => {
    loadNotes();
  }, []);

  // Validar en tiempo real
  useEffect(() => {
    if (isEditing) {
      validateFields();
    }
  }, [editTitle, editContent, isEditing]);

  // Validar campos en tiempo real
  const validateFields = () => {
    const errors = { title: '', content: '' };

    // Validar título
    if (editTitle.length > 0) {
      const result = titleSchema.safeParse(editTitle);
      if (!result.success) {
        errors.title = result.error.issues[0]?.message || 'Error de validación';
      }
    }

    // Validar contenido
    if (editContent.length > 0) {
      const result = contentSchema.safeParse(editContent);
      if (!result.success) {
        errors.content = result.error.issues[0]?.message || 'Error de validación';
      }
    }

    setValidationErrors(errors);
  };

  // Obtener todas las notas
  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      
      const validatedNotes = NotesArraySchema.parse(response.data);
      setNotes(validatedNotes);
    } catch (error) {
      console.error('Error al cargar notas:', error);
      
      if (error instanceof z.ZodError) {
        Alert.alert('Error de validación', 'Los datos recibidos no son válidos');
        console.error('Errores de validación:', error.errors);
      } else if (axios.isAxiosError(error)) {
        Alert.alert('Error de conexión', 'No se pudo conectar con el servidor');
      } else {
        Alert.alert('Error', 'No se pudieron cargar las notas');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refrescar notas
  const handleRefresh = () => {
    setRefreshing(true);
    loadNotes();
  };

  // Abrir nota para editar
  const openNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(true);
  };

  // Crear nueva nota
  const createNewNote = () => {
    setSelectedNote(null);
    setEditTitle('');
    setEditContent('');
    setValidationErrors({ title: '', content: '' });
    setIsEditing(true);
  };

  // Guardar nota (crear o actualizar)
  const saveNote = async () => {
    if (!editTitle.trim() && !editContent.trim()) {
      Alert.alert('Error', 'La nota debe tener al menos título o contenido');
      return;
    }

    try {
      const noteData = NoteCreateSchema.parse({
        title: editTitle.trim(),
        content: editContent.trim(),
        date: new Date().toLocaleDateString('es-ES')
      });

      setLoading(true);
      
      if (selectedNote?.id) {
        // Actualizar nota existente
        const response = await axios.put(`${API_URL}/${selectedNote.id}`, noteData);
        const validatedNote = NoteSchema.parse(response.data);
        
        setNotes(prevNotes => 
          prevNotes.map(note => 
            note.id === selectedNote.id ? validatedNote : note
          )
        );
      } else {
        // Crear nueva nota
        const response = await axios.post(API_URL, noteData);
        const validatedNote = NoteSchema.parse(response.data);
        
        setNotes(prevNotes => [validatedNote, ...prevNotes]);
      }
      
      Alert.alert('Éxito', 'Nota guardada correctamente');
      closeEditor();
    } catch (error) {
      console.error('Error al guardar nota:', error);
      
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join('\n');
        Alert.alert('Error de validación', errorMessages);
      } else if (axios.isAxiosError(error)) {
        Alert.alert('Error de conexión', 'No se pudo conectar con el servidor');
      } else {
        Alert.alert('Error', 'No se pudo guardar la nota');
      }
    } finally {
      setLoading(false);
    }
  };

  // Eliminar nota
  const deleteNote = async () => {
    if (!selectedNote?.id) return;

    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar esta nota?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await axios.delete(`${API_URL}/${selectedNote.id}`);
              
              setNotes(prevNotes => prevNotes.filter(note => note.id !== selectedNote.id));
              Alert.alert('Éxito', 'Nota eliminada correctamente');
              closeEditor();
            } catch (error) {
              console.error('Error al eliminar nota:', error);
              if (axios.isAxiosError(error)) {
                Alert.alert('Error de conexión', 'No se pudo conectar con el servidor');
              } else {
                Alert.alert('Error', 'No se pudo eliminar la nota');
              }
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Cerrar editor
  const closeEditor = () => {
    setIsEditing(false);
    setSelectedNote(null);
    setEditTitle('');
    setEditContent('');
    setValidationErrors({ title: '', content: '' });
  };

  // Verificar si hay errores de validación
  const hasValidationErrors = () => {
    return validationErrors.title !== '' || validationErrors.content !== '';
  };

  // Verificar si puede guardar
  const canSave = () => {
    const hasTrimmedContent = editTitle.trim().length > 0 || editContent.trim().length > 0;
    return hasTrimmedContent && !hasValidationErrors();
  };

  // Pantalla de carga inicial
  if (loading && notes.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffd60a" />
        <Text style={styles.loadingText}>Cargando notas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Lista de notas */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={notes.length === 0 ? styles.emptyScrollContent : undefined}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        >
          {notes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No hay notas</Text>
              <Text style={styles.emptySubtitle}>Toca + para crear una</Text>
            </View>
          ) : (
            notes.map((note: Note) => (
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
                <Text 
                  style={styles.noteContent}
                  numberOfLines={2}
                >
                  {note.content || 'Sin contenido'}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Modal de edición */}
        <Modal
          visible={isEditing}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closeEditor}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* Header del modal */}
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
                  disabled={loading || !canSave()}
                  style={styles.transparentButton}
                  textStyle={[
                    styles.saveButtonText,
                    !canSave() && styles.saveButtonTextDisabled
                  ]}
                />
              </View>

              {/* Editor */}
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

              {/* Botón de eliminar */}
              {selectedNote?.id && (
                <View style={styles.deleteButtonContainer}>
                  <Button 
                    onPress={deleteNote}
                    title="Eliminar nota"
                    disabled={loading}
                    style={styles.deleteButton}
                    textStyle={styles.deleteButtonText}
                  />
                </View>
              )}
            </View>
          </SafeAreaView>
        </Modal>

        {/* Botón flotante para crear nota */}
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

// Estilos
const styles = {
  // Contenedores principales
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#1c1c1e'
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center' as const,
    alignItems: 'center' as const
  },
  
  // Texto de carga
  loadingText: {
    color: '#8e8e93',
    marginTop: 16
  },
  
  // ScrollView
  scrollView: {
    flex: 1
  },
  emptyScrollContent: {
    flexGrow: 1
  },
  
  // Estado vacío
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 100
  },
  emptyTitle: {
    color: '#8e8e93',
    fontSize: 18
  },
  emptySubtitle: {
    color: '#8e8e93',
    fontSize: 14,
    marginTop: 8
  },
  
  // Tarjeta de nota
  noteCard: {
    backgroundColor: '#2c2c2e',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffd60a'
  },
  noteHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 4,
    alignItems: 'center' as const
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    flex: 1,
    marginRight: 8
  },
  noteDate: {
    fontSize: 14,
    color: '#8e8e93'
  },
  noteContent: {
    fontSize: 15,
    color: '#8e8e93',
    marginTop: 4
  },
  
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#1c1c1e'
  },
  modalContent: {
    flex: 1
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#38383a'
  },
  
  // Botones del modal
  transparentButton: {
    backgroundColor: 'transparent'
  },
  cancelButtonText: {
    fontSize: 17,
    color: '#ffd60a'
  },
  saveButtonText: {
    fontSize: 17,
    color: '#ffd60a',
    fontWeight: '600' as const
  },
  saveButtonTextDisabled: {
    color: '#8e8e93'
  },
  
  // Editor
  editorScroll: {
    flex: 1,
    padding: 16
  },
  titleInput: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    marginBottom: 4
  },
  contentInputContainer: {
    marginTop: 12
  },
  contentInput: {
    minHeight: 200,
    textAlignVertical: 'top' as const
  },
  
  // Botón de eliminar
  deleteButtonContainer: {
    padding: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#38383a'
  },
  deleteButton: {
    backgroundColor: '#ff3b30'
  },
  deleteButtonText: {
    color: '#fff'
  },
  
  _floatingButton: {
    position: 'absolute' as const,
    bottom: 40,
    right: 20,
    backgroundColor: '#ffd60a',
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  get floatingButton() {
    return this._floatingButton;
  },
  set floatingButton(value) {
    this._floatingButton = value;
  },
  floatingButtonText: {
    fontSize: 30,
    color: '#000',
    fontWeight: '300' as const
  }
};