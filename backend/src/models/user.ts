import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database';

class User extends Model {
  public userID!: number;
  public username!: string;
  public password!: string;
  public email!: string;
}

User.init({
  userID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
}, {
  sequelize,
  modelName: 'User',
});

export default User;
