import mongoose from 'mongoose';

const enrollment_schema = new mongoose.Schema(
  {
    student_id: 
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    course_id: 
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    status_id: 
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Status',
      required: true
    },
    progress_percentage: 
    {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate enrollment
enrollment_schema.index({ student_id: 1, course_id: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollment_schema);

export default Enrollment;