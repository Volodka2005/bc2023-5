const express = require('express');
const fs = require('fs');
const multer = require('multer');

const app = express();
const port = 8000;

const upload = multer();

app.use(express.json());
app.use(express.urlencoded({ extended: true}));

const notesFilePath = './notes.json';

const readNotesFromFile = () => {
  const data = fs.readFileSync(notesFilePath, 'utf8');
  return JSON.parse(data);
};

const writeNotesToFile = (notes) => {
  fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2), 'utf8');
};

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.get('/notes', (req, res) => {
  if (!fs.existsSync(notesFilePath)) {
    return res.status(404).send('No notes found');
  }
  const data = fs.readFileSync(notesFilePath);
  const notes = JSON.parse(data);
  res.json(notes);
});

app.get('/UploadForm.html', (req, res) => {
  res.sendFile(__dirname + '/static/UploadForm.html');
});
  

app.post('/upload', upload.single('note'), (req, res) => {
  const note_name = req.body.note_name;
  const note = req.body.note;
  if (!note_name || !note) {
  res.status(400).json({ error: 'Missing note_name or note field' });
  return;
  }
    
  let notes = [];
  try {
  const notesData = fs.readFileSync('notes.json', 'utf-8');
  notes = JSON.parse(notesData);
  } catch (err) {
  res.status(500).json({ error: ' Server Error' });
  }

  const existingNote = notes.find((n) => n.note_name === note_name);
  if (existingNote) {
  res.status(400).json({ error: 'Note with the same name already exists' });
  return;
  }
  notes.push({ note_name, note });
  fs.writeFileSync('notes.json', JSON.stringify(notes, null, 2));
  const formDataResponse = `
  Content-Disposition: form-data; name=${note_name}
  Content-Disposition: form-data; name=${note}
  `;
  res.set({
  'Content-Type': `multipart/form-data; boundary=boundary`,
  'Content-Length': Buffer.from(formDataResponse, 'utf-8').length
  });
  res.status(201).send(formDataResponse);
});
    
app.get('/notes/:noteName', (req, res) => {
  const noteName = req.params.noteName;
  
  if (!fs.existsSync(notesFilePath)) {
    return res.status(404).send('No notes found');
  }

  const data = fs.readFileSync(notesFilePath, 'utf-8');
  const notes = JSON.parse(data);

  const selectedNote = notes.find(note => note.note_name === noteName);

  if (!selectedNote) {
    return res.status(404).send('Note not found');
  }

  res.send(selectedNote.note);
});


app.put('/notes/:noteName', (req, res) => {
  const noteName = req.params.noteName;
  const updatedNoteText = req.body.note;
  const notes = readNotesFromFile();
  const noteIndex = notes.findIndex((n) => n.note_name === noteName);
  if (noteIndex !== -1) {
  notes[noteIndex].note = updatedNoteText;
  writeNotesToFile(notes);
  res.json({ message: 'Note updated successfully' });
  } else {
  res.status(404).json({ error: 'Note not found' });
  }
  });

  app.delete('/notes/:noteName', (req, res) => {
    const noteName = req.params.noteName;
    let notes = readNotesFromFile();
    const initialLength = notes.length;
  
    notes = notes.filter((n) => n.note_name !== noteName);
  
    if (notes.length < initialLength) {
      try {
        
        writeNotesToFile(notes); 
        res.json({ message: 'Note deleted successfully' });
      } catch (error) {
        console.error('Error writing notes to file:', error);
        res.status(500).json({ error: ' Server Error' });
      }
    } else {
      res.status(404).json({ error: 'Note not found' });
    }
  });


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
