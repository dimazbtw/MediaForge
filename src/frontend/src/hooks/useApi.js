import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE = '/api';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(async (file, onProgress) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
          onProgress?.(percent);
        }
      });

      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const getFileInfo = useCallback(async (fileId) => {
    try {
      const response = await axios.get(`${API_BASE}/info/${fileId}`);
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  const convertVideoToGif = useCallback(async (fileId, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/convert/video-to-gif`, {
        fileId,
        ...options
      });
      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const convertVideo = useCallback(async (fileId, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/convert/video`, {
        fileId,
        ...options
      });
      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const compressVideo = useCallback(async (fileId, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/compress/video`, {
        fileId,
        ...options
      });
      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const extractAudio = useCallback(async (fileId, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/extract/audio`, {
        fileId,
        ...options
      });
      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const convertImage = useCallback(async (fileId, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/convert/image`, {
        fileId,
        ...options
      });
      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const compressImage = useCallback(async (fileId, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/compress/image`, {
        fileId,
        ...options
      });
      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const resizeImage = useCallback(async (fileId, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/resize/image`, {
        fileId,
        ...options
      });
      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const applyImageFilters = useCallback(async (fileId, filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/filter/image`, {
        fileId,
        filters
      });
      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const cropImage = useCallback(async (fileId, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/crop/image`, {
        fileId,
        ...options
      });
      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const getProgress = useCallback(async (taskId) => {
    try {
      const response = await axios.get(`${API_BASE}/progress/${taskId}`);
      return response.data;
    } catch (err) {
      return { percent: 0, status: 'error' };
    }
  }, []);

  const trimVideo = useCallback(async (fileId, startTime, endTime) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/trim/video`, {
        fileId,
        startTime,
        endTime
      });
      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const deleteFile = useCallback(async (fileId) => {
    try {
      await axios.delete(`${API_BASE}/file/${fileId}`);
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  }, []);

  return {
    loading,
    error,
    progress,
    setError,
    uploadFile,
    getFileInfo,
    convertVideoToGif,
    convertVideo,
    compressVideo,
    extractAudio,
    trimVideo,
    convertImage,
    compressImage,
    resizeImage,
    applyImageFilters,
    cropImage,
    getProgress,
    deleteFile
  };
}
