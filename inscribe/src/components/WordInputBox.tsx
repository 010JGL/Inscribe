// src/components/WordInputBox.tsx

import React, { useState, ChangeEvent, FormEvent } from 'react';

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
    <div className="word-input-box">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter a word"
          value={word}
          onChange={handleChange}
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default WordInputBox;