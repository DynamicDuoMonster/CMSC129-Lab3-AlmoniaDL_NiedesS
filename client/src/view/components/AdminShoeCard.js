import ShoeDetails from './ShoeDetails';
import '../styles/dashboard.css';

const AdminShoeCard = ({ shoe, onDelete, onEdit }) => {
  return (
    <div className="shoe-card-admin">
      <ShoeDetails shoe={shoe} disableClick />
      <div className="admin-actions">
        <button className="btn-edit" onClick={() => onEdit(shoe)}>Edit</button>
        <button className="btn-delete" onClick={() => onDelete(shoe._id)}>Delete</button>
      </div>
    </div>
  );
};

export default AdminShoeCard;