import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Button } from '@mui/material';

interface WordInputBoxProps {
  onWordSubmit: (word: string) => void;
}

const WordInputBox: React.FC<WordInputBoxProps> = ({ onWordSubmit }) => {
  const [word, setWord] = useState<string>('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setWord(e.target.value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onWordSubmit(word);
    setWord('');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '20px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <input
          type="text"
          placeholder="Enter a word"
          value={word}
          onChange={handleChange}
          style={{ 
            width: '100%', 
            maxWidth: '600px',  // Adjust maximum width as needed
            minWidth: '200px',  // Ensure a minimum width
            padding: '10px', 
            fontSize: '1.2rem',
            boxSizing: 'border-box', // Ensure padding is included in width
            marginBottom: '10px' 
          }}
        />
        <Button variant='contained' type="submit">Submit</Button>
      </form>
    </div>
  );
};

export default WordInputBox;
