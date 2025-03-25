import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Settings } from 'lucide-react';
import { translateText } from '../utils/translate';

export function RealtimeTranslator() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
    const [error, setError] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const mediaRecorder = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const initializeRecognition = () => {
      if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
        setError('お使いのブラウザは音声認識をサポートしていません。');
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ja-JP';
      recognitionRef.current.maxAlternatives = 1;
      
      // 音声認識の開始時のハンドラを追加
      recognitionRef.current.onstart = () => {
        console.log('音声認識開始');
        setError('');
      };
      
      // 音声認識の終了時のハンドラを追加
      recognitionRef.current.onend = () => {
        console.log('音声認識終了');
        // 録音中であれば自動的に再開
        if (isRecording) {
          setTimeout(() => {
            recognitionRef.current.start();
          }, 1000); // Add a slight delay before restarting
        }
      };

      recognitionRef.current.onresult = async (event) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const transcriptText = result[0].transcript;
        setTranscript(transcriptText);
        
        try {
          const translatedText = await translateText(transcriptText, 'ja', targetLanguage);
           setTranslation(translatedText);
        } catch (err) {
          setError(err.message);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.log('Speech Recognition Error:', event);
        if (event.error === 'network') {
          setError('ネットワークエラー: インターネット接続を確認してください。音声認識には安定した接続が必要です。');
          // 3秒後に自動的に再試行
          if (isRecording) {
            setTimeout(() => {
              recognitionRef.current.start();
            }, 3000); // Retry after 3 seconds
          }
        } else {
          setError(`音声認識エラー: ${event.error}`);
          stopRecording();
        }
      };
    };

    initializeRecognition();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [targetLanguage]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      recognitionRef.current.start();
      setIsRecording(true);
      setError('');
    } catch (err) {
      setError(`マイクへのアクセスエラー: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-md rounded-lg">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">リアルタイム音声翻訳</h1>
        <Settings className="w-6 h-6 text-gray-500 cursor-pointer" />
      </div>

      <div className="space-y-6">
        <div className="flex justify-center space-x-4">
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="en">英語</option>
            <option value="zh">中国語</option>
            <option value="es">スペイン語</option>
            <option value="th">タイ語</option>
          </select>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-4 rounded-full ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors shadow-md`}
          >
            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="p-4 bg-gray-100 rounded-lg min-h-24 shadow-inner">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">音声認識結果:</h2>
            <p className="text-gray-700">{transcript || '音声を認識待ち...'}</p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg min-h-24 shadow-inner">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">翻訳結果 ({{
              en: '英語',
              zh: '中国語',
              es: 'スペイン語',
              th: 'タイ語'
            }[targetLanguage]}):</h2>
            <p className="text-gray-700">{translation || '翻訳待ち...'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
