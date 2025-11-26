import { Ionicons } from '@expo/vector-icons';
import { GoogleGenAI } from "@google/genai";
import axios from 'axios';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { contentSchema } from '../lib/contentSchema';
import { titleSchema } from '../lib/titleSchema';
import { colors } from '../styles/colors';
import { styles } from '../styles/styles';
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
if (!API_KEY) {
  console.warn('Falta la variable de entorno EXPO_PUBLIC_GEMINI_API_KEY.');
}

const BASE_URL = "https://3000-firebase-myfirstsumativeapp-1763932350939.cluster-f73ibkkuije66wssuontdtbx6q.cloudworkstations.dev"  

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

async function generateTaskExplanation(task: string): Promise<string> {
  if (!ai) {
    throw new Error('La API de Gemini no está configurada. Verifica tu API Key.');
  }

  const prompt = `Como asistente virtual de notas, analiza el siguiente texto (que es una tarea o nota) y proporciona una guía detallada paso a paso sobre cómo abordarla o completarla. Responde de forma clara y concisa, utilizando listas o enumeraciones si es necesario. Texto a analizar: "${task}"`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: `Responde siempre en español: ${prompt}`,
    });

    if (result.text) {
      return result.text;
    } else {
      throw new Error('La respuesta de la IA no contiene texto.');
    }
  } catch (error) {
    console.error('Error generando explicación:', error);
    // @ts-ignore
    const errorMessage = error.message || 'Error desconocido al contactar a la IA.';
    throw new Error(`Error al contactar a la IA: ${errorMessage}`);
  }
}

const NoteSchema = z.object({
  id: z.string().or(z.number()).transform(String), 
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState('');


  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/notes`).then((res)=>{
        return res.data;
      });
      setNotes(response);
    } catch (error) {
      console.error("Error cargando notas:", error);
      Alert.alert("Error", "No se pudieron cargar las notas. Asegúrate de que el servidor está corriendo en la URL base configurada.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEditing) validateFields();
  }, [editTitle, editContent, isEditing]);

  useEffect(() => {
    return () => Speech.stop();
  }, []);

  const validateFields = () => {
    const errors = { title: '', content: '' };

    if (editTitle.length > 0) {
      const result = titleSchema.safeParse(editTitle);
      if (!result.success) errors.title = result.error.issues[0]?.message;
    }

    if (editContent.length > 0) {
      const result = contentSchema.safeParse(editContent);
      if (!result.success) errors.content = result.error.issues[0]?.message;
    }

    setValidationErrors(errors);
  };

  const openNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(true);
    setIsViewingLockedNote(true);
    setAiGeneratedContent('');
  };

  const createNewNote = () => {
    setSelectedNote(null);
    setEditTitle('');
    setEditContent('');
    setValidationErrors({ title: '', content: '' });
    setIsEditing(true);
    setIsViewingLockedNote(false);
    setAiGeneratedContent('');
  };

  const saveNote = async () => {
    if (!editTitle.trim() && !editContent.trim()) {
      Alert.alert('Error', 'La nota debe tener al menos un título o contenido.');
      return;
    }

    if (validationErrors.title || validationErrors.content) {
      Alert.alert('Error', 'Corrige los errores antes de guardar.');
      return;
    }

    setLoading(true);

    const now = new Date();
    const formattedDate = now.toLocaleDateString("es-ES");

    const noteData = {
      title: editTitle.trim(),
      content: editContent.trim(),
      date: formattedDate,
    };

    try {
      if (selectedNote?.id) {
        const response = await axios.put(`${BASE_URL}/notes/${selectedNote.id}`, noteData);
        const updatedNote = NoteSchema.parse(response.data);
        setNotes(notes.map(note => note.id === updatedNote.id ? updatedNote : note));
      } else {
        const response = await axios.post(`${BASE_URL}/notes`, noteData);
        const newNote = NoteSchema.parse(response.data);
        setNotes([newNote, ...notes]);
      }

      closeEditor();
    } catch (error) {
      console.error("Error guardando nota:", error);
      Alert.alert("Error", "No se pudo guardar la nota.");
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = () => {
    if (!selectedNote?.id) return;

    Alert.alert(
      "Confirmar eliminación",
      "¿Seguro que quieres eliminar esta nota?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${BASE_URL}/notes/${selectedNote.id}`);
              setNotes(notes.filter(note => note.id !== selectedNote.id));
              closeEditor();
            } catch (error) {
              console.error("Error eliminando nota:", error);
              Alert.alert("Error", "No se pudo eliminar la nota.");
            }
          },
        },
      ]
    );
  };

  const closeEditor = () => {
    setIsEditing(false);
    setSelectedNote(null);
    setEditTitle('');
    setEditContent('');
    setValidationErrors({ title: '', content: '' });
    setIsViewingLockedNote(false);
    setGenerationError(null);
    setAiGeneratedContent('');
    Speech.stop();
    setIsSpeaking(false);
  };

  const canSave = () =>
    (editTitle.trim() || editContent.trim()) &&
    !validationErrors.title &&
    !validationErrors.content;

  const handleGenerateContent = async () => {
    if (!editContent.trim()) {
      Alert.alert("Error", "Escribe una descripción antes de generar.");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setAiGeneratedContent('');
    try {
      const content = await generateTaskExplanation(editContent);
      setAiGeneratedContent(content);
    } catch (err: any) {
      setGenerationError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const speakDescription = async () => {
    if (!aiGeneratedContent.trim()) return;

    if (await Speech.isSpeakingAsync()) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    Speech.speak(aiGeneratedContent, {
      language: "es-ES",
      onStart: () => setIsSpeaking(true),
      onDone: () => setIsSpeaking(false),
    });
  };
const filteredNotes = notes.filter(note => {

  const noteTitle = note.title || '';
  const noteContent = note.content || '';

  if (!noteTitle.trim() && !noteContent.trim()) {
      return false; 
  }

  const matchesSearch = noteTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        noteContent.toLowerCase().includes(searchQuery.toLowerCase());

  return matchesSearch;
});

  if (loading && notes.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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
                <Text style={styles.emptyTitle}>No se encontraron notas con ese término</Text>
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
                      <ActivityIndicator size="small" color={colors.primary} />
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

                {/* Botón de ayuda con IA - visible en modo visualización */}
                {isViewingLockedNote && (
                  <>
                    <View style={{ marginTop: 12, marginBottom: 8 }}>
                      <Button
                        onPress={handleGenerateContent}
                        title={isGenerating ? "Generando..." : "Ayúdame con esta tarea"}
                        disabled={isGenerating || !editContent.trim()}
                        loading={isGenerating}
                        style={{
                          backgroundColor: colors.lightest,
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: 12,
                          borderRadius: 8,
                        }}
                        textStyle={{
                          color: colors.darkest,
                          fontSize: 16,
                          fontWeight: '600',
                        }}
                        icon={<Ionicons name="bulb-outline" size={18} color={colors.darkest} style={{ marginRight: 6 }} />}
                      />
                    </View>
                    
                    {generationError && (
                      <Text style={{ color: '#BF360C', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                        {generationError}
                      </Text>
                    )}

                    {/* Contenido generado por IA */}
                    {aiGeneratedContent ? (
                      <View style={{
                        marginTop: 12,
                        backgroundColor: colors.dark,
                        padding: 16,
                        borderRadius: 12,
                        borderLeftWidth: 4,
                        borderLeftColor: colors.lightest,
                      }}>
                        <Text style={{
                          color: colors.lightest,
                          fontSize: 16,
                          fontWeight: '600',
                          marginBottom: 8,
                        }}>
                          Guía de ayuda:
                        </Text>
                        <Text style={{
                          color: colors.light,
                          fontSize: 15,
                          lineHeight: 22,
                        }}>
                          {aiGeneratedContent}
                        </Text>
                        
                        {/* Botón para leer la guía generada */}
                        <TouchableOpacity 
                          onPress={speakDescription} 
                          style={{
                            marginTop: 12,
                            backgroundColor: colors.lightest,
                            padding: 12,
                            borderRadius: 8,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Ionicons 
                            name={isSpeaking ? "stop-circle-outline" : "volume-high-outline"} 
                            size={20} 
                            color={colors.darkest}
                            style={{ marginRight: 6 }}
                          />
                          <Text style={{ color: colors.darkest, fontSize: 16, fontWeight: '600' }}>
                            {isSpeaking ? "Detener lectura" : "Leer guía"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </>
                )}
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