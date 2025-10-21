import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Card, Button, Modal, Form } from 'react-bootstrap';

const LessonsPage = () => {
  const { subjectName } = useParams();
  const [lessons, setLessons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', lesson_data: '' });
  const [loading, setLoading] = useState(false);

  // Fetch lessons for the subject/module
  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', subjectName);
      if (!error) setLessons(data);
      setLoading(false);
    };
    fetchLessons();
  }, [subjectName]);

  // Create lesson
  const handleCreateLesson = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('lessons')
      .insert([
        {
          id: crypto.randomUUID(),
          title: form.title,
          description: form.description,
          lesson_data: form.lesson_data ? JSON.parse(form.lesson_data) : {},
          module_id: subjectName,
        },
      ]);
    if (!error) {
      setShowModal(false);
      setForm({ title: '', description: '', lesson_data: '' });
      // Refresh lessons
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', subjectName);
      setLessons(data);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 32 }}>
      <h1>Lessons for {subjectName}</h1>
      <Button onClick={() => setShowModal(true)} style={{ marginBottom: 24 }}>Create Lesson</Button>
      {loading && <p>Loading...</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {lessons.map(lesson => (
          <Card key={lesson.id} style={{ width: 320 }}>
            <Card.Body>
              <Card.Title>{lesson.title}</Card.Title>
              <Card.Text>{lesson.description}</Card.Text>
              <pre style={{ fontSize: 12, background: '#f8fafc', padding: 8 }}>{JSON.stringify(lesson.lesson_data, null, 2)}</pre>
            </Card.Body>
          </Card>
        ))}
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Lesson</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Title</Form.Label>
              <Form.Control value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Lesson Data (JSON)</Form.Label>
              <Form.Control as="textarea" rows={3} value={form.lesson_data} onChange={e => setForm({ ...form, lesson_data: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateLesson} disabled={loading}>Create</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default LessonsPage;
