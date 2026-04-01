## 继承

> * 继承是一种扩展现有类并未基类提供新功能的一种方式
> * 继承后的子类将包含父类（基类）所包含的一切，是父类（基类）的一个**超集**

```c++
#include <iostream>

class Entity {
public:
    float X, Y;
    
    void Move(float xa, float ya) {
        X += xa;
        Y += ya;
    }
};

class Player : public Entity { // 继承的写法，如继承多个则用逗号并列
public:
    const char* Name;
    
    void PrintName() {
        std::cout << Name << std::endl;
    }
};

int main() {
    Player player;
    player.X = 2;
    player.Y = 1;
    player.Move(5, 4);
}
```

继承可以使子类在父类所有功能的基础上，添加自己的独有实现，这也使得**子类可以适用于所有以父类为输入的场合**（即`Player`类实际上也是`Entity`类）；另外，一个类可以继承自多个父类，子类也可以拥有自己的子类，并按照继承链包含所有父类的内容

## 虚函数

> * 虚函数允许父类（基类）的方法在子类中被重写

### 声明与功能

在类的成员方法前添加`virtual`关键字，即可声明该方法允许被子类的同名方法重写。由于子类是父类的超集，因此子类同样适用于所有用父类作为输入的地方，当需要同一功能对父类和子类产生不同的效果时，即可使用虚函数并在子类中重写，示例如下：（同一函数`PrintName`对子类`Player`和父类`Entity`产生不同的输出）

```c++
#include <iostream>
#include <string>

class Entity {
public:
    virtual std::string GetName() { return "Entity"; }
    // virtual 告诉编译器这是一个虚函数方法
};

class Player : public Entity {
private:
    std::string m_Name;
public:
    Player(const std::string& name)
        : m_Name(name) {}
    
    std::string GetName() override { return m_Name; }
    // 此处的 override 表示这是覆写父类（基类）的一个方法
};

void PrintName(Entity* entity) {
    std::cout << entity->GetName() << std::endl;
}

int main() {
    Entity* e = new Entity();
    PrintName(e); // Entity
    
    Player* p = new Player("Past");
    PrintName(p); // Past, 如不使用虚函数将输出 Entity
}
```

其中，`override`关键字并非必需的，但显式写出来有助于标明具有覆写功能的方法，并且编译器此时会检查父类是否具有同名函数，方便debug

### 运行成本

* 使用虚函数时，需要额外的内存来存储虚表，且父类（基类）中会有一个成员指针指向虚表
* 每次调用虚函数时，都需要先遍历虚表来确定应该映射到哪个函数

## 纯虚函数（接口）

> * 纯虚函数允许在父类（基类）中定义一个没有实现且强制子类实现的函数，也被称为接口

在面向对象的编程中，通常会有一个类，该类只由未实现的方法组成，并强制子类去实际实现它们。这种类一般作为**模板**，只提供接口，不会被实例化为对象。模板的子类中如果没有完全实现父类所有的纯虚函数，则该子类将不被允许实例化

* 纯虚函数的定义：**virtual 函数返回值类型 函数名(参数组合) = 0;**

```c++
#include <iostream>
#include <string>

class Printable {
public:
    virtual std::string GetClassName() = 0; // 纯虚函数
};

class Entity : public Printable {
public:
    std::string GetClassName() override { return "Entity"; }
};

class Player : public Entity {
public:
    std::string GetClassName() override { return "Player"; } // 注意这里同样是 override
};

void Print(Printable* obj) {
    std::cout << obj->GetClassName() << std::endl;
}

int main() {
    Entity* e = new Entity();
    Player* p = new Player();
    
    Print(e); // Entity
    Print(p); // Player
}
```

* 逻辑上可以不在`Player`类中定义`GetClassName`函数，因为它已经继承了`Entity`类也就拥有了`Entity`类中对纯虚函数的实现
* 但是如果想要`Print`函数对`Entity`类和`Player`类有不同的行为，则必须在`Player`类中进行自己的实现，否则输出两个`"Entity"`