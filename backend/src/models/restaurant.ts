import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database';
import User from './user';

class Restaurant extends Model {
  public restaurantID!: number;
  public name!: string;
  public description!: string;
  public latitude!: number;
  public longitude!: number;
  public imagePath!: string;
  public creatorUserID!: number;
}

Restaurant.init({
  restaurantID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  imagePath: {
    type: DataTypes.STRING,
  },
}, {
  sequelize,
  modelName: 'Restaurant',
});

User.hasMany(Restaurant, { foreignKey: 'creatorUserID' });
Restaurant.belongsTo(User, { foreignKey: 'creatorUserID' });

export default Restaurant;
