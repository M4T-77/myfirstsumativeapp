import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const styles = StyleSheet.create({
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: colors.dark,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.dark,
    color: colors.light,
    fontSize: 18, 
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
